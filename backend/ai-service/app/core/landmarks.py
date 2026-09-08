"""Shared MediaPipe Face Mesh setup.

Both gaze_service.py (head pose + eye tracking) and identity_service.py
(face alignment for ArcFace) need dense facial landmarks. This module
gives each of them a get_face_landmarks() call with the same interface,
without either service having to know how the underlying FaceMesh
instance is managed.

This went through two iterations before landing here -- worth recording
why, since both earlier attempts looked reasonable and both failed only
under real concurrent load:

Attempt 1: one shared _face_mesh instance, no locking. Segfaulted the
process almost immediately under concurrent /infer/gaze +
/infer/identity/embed traffic (verified: stripped the lock in testing
specifically to confirm this, and it crashed the whole test run).

Attempt 2: one shared _face_mesh instance behind a threading.Lock(),
serializing every process() call. This stopped the segfault, but under
sustained concurrent load (many overlapping /infer/analyze calls, which
each hit this module twice -- once via gaze_service, once via
identity_service) it started throwing real errors from the underlying
MediaPipe calculator graph: "Packet timestamp mismatch" style errors in
static_image_mode=False (tracking mode keeps internal frame-sequence
state that a Python lock alone doesn't reset correctly across callers),
and *even after* switching to static_image_mode=True to remove that
tracking state, a different error persisted: "Packet type mismatch...
Empty packets are not allowed". That second failure matches a
long-standing, still-open class of MediaPipe Python-binding bug
(google-ai-edge/mediapipe#2269 and similar reports of core dumps /
'PyEval_SaveThread: NULL tstate' under multi-threaded Solutions API use)
-- the underlying graph object carries thread-affinity state that a
Python-level mutex can't paper over, because a lock only prevents two
threads calling process() *at the same instant*, not the graph being
called by a *different* thread than the one before it, which is exactly
what happens when arbitrary worker-pool threads share one instance one
at a time.

Current approach: one FaceMesh instance per thread (threading.local),
never shared. Each worker thread that ever calls get_face_landmarks()
gets its own dedicated graph, created lazily on first use and reused for
that thread's lifetime -- so a given instance is always called from the
same thread it was created on, which is exactly the assumption the
underlying graph needs. No lock required: there's no shared mutable
state left to race on. The memory cost is one FaceMesh instance (modest;
this is the landmark model, not YOLO/ArcFace) per pool thread instead of
one process-wide, which is a normal trade-off for this fix.

static_image_mode=False (tracking mode) is kept, not True: measured on
a 400-image real-face calibration set, landmark-detection success was
400/400 under False vs 334/400 under True, with clean genuine/impostor
similarity separation under False and real overlap under True. The
dominant real case -- one exam session's own thread handling that
session's repeated frames -- genuinely is a continuous same-subject
stream per-thread, matching tracking mode's assumption.
"""

import threading

import cv2
import mediapipe as mp
import numpy as np

_mp_face_mesh = mp.solutions.face_mesh
_thread_local = threading.local()
# Constructing a FaceMesh (TFLite/XNNPACK model load + interpreter init)
# is a different operation from running one, and testing showed it is NOT
# safe to do concurrently even when each thread ends up with its own
# independent instance afterward -- concurrent construction alone produced
# "Packet type mismatch... Empty packets are not allowed" errors that never
# occurred once construction was serialized. This lock guards ONLY the
# lazy-construction branch below; once a thread has its own instance,
# its process() calls run fully unlocked and in parallel with everyone
# else's, since there's no shared state left to contend on at that point.
_construction_lock = threading.Lock()


def _get_face_mesh():
    face_mesh = getattr(_thread_local, "face_mesh", None)
    if face_mesh is None:
        with _construction_lock:
            face_mesh = _mp_face_mesh.FaceMesh(
                static_image_mode=False,
                max_num_faces=1,
                refine_landmarks=True,  # also emits iris landmarks (indices 468-477)
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5,
            )
        _thread_local.face_mesh = face_mesh
    return face_mesh


def get_face_landmarks(frame: np.ndarray):
    """Returns the 478 normalized landmarks for the first detected face,
    or None if no face was found.
    """
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_mesh = _get_face_mesh()
    result = face_mesh.process(rgb_frame)
    if not result.multi_face_landmarks:
        return None
    return result.multi_face_landmarks[0].landmark