import test from 'tape-catch';
import {TermBuffer} from '..';

test("should work", function (assert) {
  const b0 = new TermBuffer();
  assert.equal(b0.cursor.column, 0, 'cursor starts in column 0');
  const b1 = b0.write('H');
  assert.equal(b1.cursor.column, 1, 'cursor moved after write');
  assert.equal(b1.lines[0][0].char, 'H', 'character is written');
  assert.end();
});
