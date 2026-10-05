# 💻 Online C Compiler & Editor

A fully working, modern Online C Compiler and Editor inspired by [Programiz Online C Compiler](https://www.programiz.com/c-programming/online-compiler/), powered by **GCC** on your machine.

---

## 🚀 Features

- **Rich Code Editor**: Powered by Monaco Editor (the same editor engine behind VS Code) with:
  - Full C syntax highlighting & auto-completion
  - Bracket pair colorization & code folding
  - Line numbers, cursor position tracker (Line, Col)
  - Auto-save to local storage (never lose your work on refresh)
- **Real-time Terminal & Execution**:
  - Live interactive console supporting standard input (`scanf()`, `getchar()`, `fgets()`)
  - Batch Custom Input tab for pre-populating `stdin`
  - Exact compilation time & execution time metrics
  - Detailed error & warning diagnostics with exact line/column indicators
  - Infinite loop protection (10-second automatic timeout guard)
- **Preloaded Code Examples**:
  1. Hello World
  2. User Input (`scanf`)
  3. Loops & Arrays
  4. Pointers & Dynamic Memory (`malloc` / `free`)
  5. Structs & Records
  6. Recursion (Fibonacci)
  7. Math Library (`sqrt`, `pow`, `sin`)
  8. String Processing
- **Toolbar Utilities**:
  - `Run` button (`Ctrl + Enter`) & `Stop` button (`Escape`)
  - Format code & Reset code
  - Copy code & Copy output to clipboard
  - Download `.c` file & Upload existing `.c` file
  - Font size adjuster (`A-`, `A+`)
  - Dark Theme & Light Theme toggle
  - Draggable split-pane layout to resize editor & console

---

## 🏃 How to Start the Compiler

### Option 1: Double-Click Launcher (Easiest)
Double-click `start.bat` in this folder. It will launch the backend server and automatically open the application in your default web browser at `http://localhost:3000`.

### Option 2: Command Line
```bash
npm start
```
Then visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + Enter` (or `Cmd + Enter`) | Compile & Run C Code |
| `Escape` | Stop running program |
| `Ctrl + S` | Saved automatically in browser |
