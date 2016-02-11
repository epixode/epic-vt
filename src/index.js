
import StateThread from './state_thread';

export const TermBuffer = function (options) {
  options = options || {};
  this.width = options.width || 80;
  this.height = options.lines || 24;
  this.cursor = {line: 0, column: 0};
  this.attrs = {};
  this.lines = Array(this.height).fill(Array(this.width).fill({char: ' ', attrs: this.attrs}));
};

StateThread.enable(TermBuffer, ['lines', 'cursor', 'attrs']);

TermBuffer.prototype.write = StateThread.run(function (str) {
  this._write(str);
});

TermBuffer.prototype._write = function (str) {
  for (let i = 0; i < str.length; i++) {
    const char = str.charAt(i);
    this._writeChar(str.charAt(i));
  }
};

TermBuffer.prototype._writeChar = function (char) {

  if (char === '\n') {
    this._newline();
    return;
  }

  if (char === '\r') {
    // Move the cursor to the beginning of the current line.
    this._cursor.column = 0;
    return;
  }

  // Write the caracter using the current attributes and
  // move the cursor.
  const cursor = this._cursor;
  cursor.column += 1;
  if (cursor.column >= this.width)
    this._newline();
  const line = this._lines._(cursor.line);
  line[cursor.column] = {char, attrs: this.attrs};

};

TermBuffer.prototype._newline = function () {
  // Move the cursor to the beginning of the next line.
  const cursor = this._cursor;
  cursor.line += 1;
  cursor.column = 0;
  // Scroll by one line if needed.
  if (cursor.line > this.height) {
    const lines = this._lines;
    lines.splice(0, 1);
    lines.push(Array(this.width).fill({char: ' ', attrs: this.attrs}));
  }
};

export default TermBuffer;
