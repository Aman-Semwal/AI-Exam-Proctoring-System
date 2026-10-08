package com.proctor.proctorbackend.violation;

/** What the browser reported when a student left the exam. */
public enum BrowserSignal {
    /** The exam tab was hidden — another tab, or the browser minimised. */
    TAB_HIDDEN,
    /** The window lost focus but the tab stayed visible — another app, or a system pop-up. */
    WINDOW_BLUR,
    /** The student left full-screen mode. */
    FULLSCREEN_EXIT
}
