package com.proctor.proctorbackend.violation;

/** What the browser reported when a student left the exam. */
public enum BrowserSignal {
    /** The exam tab was hidden — another tab, or the browser minimised. */
    TAB_HIDDEN,
    /** The window lost focus but the tab stayed visible — another app, or a system pop-up. */
    WINDOW_BLUR,
    /** The student left full-screen mode. */
    FULLSCREEN_EXIT,
    /** The entire-screen share ended (the student clicked "Stop sharing"). */
    SCREEN_SHARE_ENDED,
    /** Blocked clipboard copy. */
    COPY,
    /** Blocked clipboard cut. */
    CUT,
    /** Blocked clipboard paste. */
    PASTE,
    /** Blocked right-click menu. */
    CONTEXT_MENU,
    /** Blocked keyboard shortcut (print, save, view source, DevTools…). */
    SHORTCUT
}
