import * as vscode from "vscode";
import * as path from "path";

interface Config {
  timerLength: number;
  modalPopup: boolean;
}

interface TimerConfig {
  name: string;
  length: number;
  startTime: number;
  timeRemaining?: number;
  paused?: boolean;
}

export class TreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  modalPopup: boolean;
  timers: TimerConfig[];

  constructor({ timerLength, modalPopup }: Config) {
    this.modalPopup = modalPopup;
    this.timers = [{ name: "Stand Up", length: 2, startTime: Date.now() }];
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (this.timers.some((timer) => !timer.paused)) {
      setTimeout(() => this._onDidChangeTreeData.fire(), 1000);
    }
    return Promise.resolve(
      this.timers.map((timer) => {
        const timeElapsed = Date.now() - timer.startTime;
        timer.timeRemaining = timer.length * 60 * 1000 - timeElapsed;
        if (timer.timeRemaining < 0) {
          console.log("[🪵 🤖][MoveMoreTreeProvider.ts][Line: 30]");

          if (!timer.paused) {
            vscode.window
              .showInformationMessage(
                `Timer "${timer.name}" Finished.`,
                { modal: this.modalPopup },
                "Reset Timer"
              )
              .then((selection) => {
                if (selection === "Reset Timer") {
                  timer.startTime = Date.now();
                  timer.paused = false;
                  this._onDidChangeTreeData.fire();
                  return;
                }
              });
            timer.paused = true;
          }

          return new TimerItem(
            timer.name,
            "Finished",
            `${timer.name} Finished`,
            vscode.TreeItemCollapsibleState.None
          );
        }

        return new TimerItem(
          timer.name,
          `${this.millisToMinutesAndSeconds(timer.timeRemaining)} Remaining`,
          `${timer.name} timer`,
          vscode.TreeItemCollapsibleState.None
        );
      })
    );
  }

  resetTimer({ label }: TimerItem) {
    console.log("yo what on");
    const timer = this.timers.find((timer) => timer.name === label);
    if (timer) {
      console.log("Found timer", timer.name);
      timer.startTime = Date.now();
      timer.paused = false;
      this._onDidChangeTreeData.fire();
    }
  }

  resetAll() {
    this.timers.forEach((timer) => {
      timer.startTime = Date.now();
      timer.paused = false;
    });
    this._onDidChangeTreeData.fire();
  }

  deleteTimer({ label }: TimerItem) {
    console.log("deleting", label);
    this.timers = this.timers.filter((timer) => timer.name !== label);
  }

  addTimer(name: string, length: number) {
    this.timers.push({
      name: name,
      length: length,
      startTime: Date.now(),
    });
  }

  private millisToMinutesAndSeconds(millis: number): string {
    const seconds = Math.floor((millis / 1000) % 60);
    const minutes = Math.floor((millis / (1000 * 60)) % 60);
    const hours = Math.floor((millis / (1000 * 60 * 60)) % 24);

    return `${hours < 10 ? "0" + hours : hours}:${
      minutes < 10 ? "0" + minutes : minutes
    }:${seconds < 10 ? "0" + seconds : seconds}`;
  }
}

class TimerItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly tooltip: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.contextValue = description;
  }

  iconPath = {
    light: "$(history)",
    dark: "$(history)",
  };
}

class AddTimerItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly tooltip: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(`hello`, collapsibleState);
    this.contextValue = "add-timer";
  }

  iconPath = {
    light: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "light",
      "dependency.svg"
    ),
    dark: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "dark",
      "dependency.svg"
    ),
  };
}
