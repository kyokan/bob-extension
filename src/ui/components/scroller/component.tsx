import React, { FunctionComponent } from "react";
import "./styles.scss";

// // // //

// Scripts to execute in current tab
const scrollToTopScript = `window.scroll(0,0)`;
const scrollToBottomScript = `window.scroll(0,9999999)`;

/**
 * Executes a string of Javascript on the current tab
 * @param code The string of code to execute on the current tab
 */
function executeScript(code: string): void {
    // Query for the active tab in the current window
    chrome.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs: chrome.tabs.Tab[]) => {
            // Pulls current tab from browser.tabs.query response
            const currentTab: chrome.tabs.Tab | undefined = tabs[0];

            // Short circuits function execution is current tab isn't found
            if (!currentTab) {
                return;
            }

            // Executes the script in the current tab
            chrome.tabs
                .executeScript(currentTab.id, {
                    code,
                })
                .then(() => {
                    console.log("Done Scrolling");
                });
        });
}

// // // //

export const Scroller: FunctionComponent = () => {
    return (
        <div className="row">
            <div className="col-lg-12">
                <button
                    className="btn btn-block btn-outline-dark"
                    onClick={(): void => executeScript(scrollToTopScript)}
                >
                    Scroll To Top
                </button>
                <button
                    className="btn btn-block btn-outline-dark"
                    onClick={(): void => executeScript(scrollToBottomScript)}
                >
                    Scroll To Bottom
                </button>
            </div>
        </div>
    );
};
