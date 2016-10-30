/* tslint:disable quotemark */

import {assert} from 'chai';
import {parseUnitModel} from '../../util';
import {X, Y} from '../../../src/channel';
import {rule} from '../../../src/compile/mark/rule';

describe('Mark: Rule', function() {
  it('should return the correct mark type', function() {
    assert.equal(rule.markType(), 'rule');
  });

  describe('with x-only', () => {
    const model = parseUnitModel({
      "mark": "rule",
      "encoding": {"x": {"field": "a", "type": "quantitative"}}
    });

    const props = rule.properties(model);

    it('should create vertical rule that fits height', function() {
      assert.deepEqual(props.x, {scale: X, field: 'a'});
      assert.deepEqual(props.y, {field: {group: 'height'}});
      assert.deepEqual(props.y2, {value: 0});
    });
  });

  describe('with y-only', () => {
    const model = parseUnitModel({
      "mark": "rule",
      "encoding": {"y": {"field": "a", "type": "quantitative"}}
    });

    const props = rule.properties(model);

    it('should create horizontal rule that fits height', function() {
      assert.deepEqual(props.y, {scale: Y, field: 'a'});
      assert.deepEqual(props.x, { value: 0 });
      assert.deepEqual(props.x2, { field: { group: 'width' } });
    });
  });

  describe('with x and x2 only', () => {
    const model = parseUnitModel({
      "mark": "rule",
      "encoding": {
        "x": {"field": "a", "type": "quantitative"},
        "x2": {"field": "a2", "type": "quantitative"}
      }
    });

    const props = rule.properties(model);

    it('should create horizontal rule on the axis', function() {
      assert.deepEqual(props.x, {scale: X, field: 'a'});
      assert.deepEqual(props.x2, {scale: X, field: 'a2'});
      assert.deepEqual(props.y, { field: { group: 'height' } });
    });
  });

  describe('with y and y2 only', () => {
    const model = parseUnitModel({
      "mark": "rule",
      "encoding": {
        "y": {"field": "a", "type": "quantitative"},
        "y2": {"field": "a2", "type": "quantitative"}
      }
    });

    const props = rule.properties(model);

    it('should create horizontal rules on the axis', function() {
      assert.deepEqual(props.y, {scale: Y, field: 'a'});
      assert.deepEqual(props.y2, {scale: Y, field: 'a2'});
      assert.deepEqual(props.x, {value: 0});
    });
  });

  describe('with x, x2, and y', () => {
    const model = parseUnitModel({
      "mark": "rule",
      "encoding": {
        "x": {"field": "a", "type": "quantitative"},
        "x2": {"field": "a2", "type": "quantitative"},
        "y": {"field": "b", "type": "quantitative"}
      }
    });

    const props = rule.properties(model);

    it('should create horizontal rules', function() {
      assert.deepEqual(props.x, {scale: X, field: 'a'});
      assert.deepEqual(props.x2, {scale: X, field: 'a2'});
      assert.deepEqual(props.y, {scale: Y, field: 'b'});
    });
  });

  describe('with y, y2, and x', () => {
    const model = parseUnitModel({
      "mark": "rule",
      "encoding": {
        "y": {"field": "a", "type": "quantitative"},
        "y2": {"field": "a2", "type": "quantitative"},
        "x": {"field": "b", "type": "quantitative"}
      }
    });

    const props = rule.properties(model);

    it('should create vertical rules', function() {
      assert.deepEqual(props.y, {scale: Y, field: 'a'});
      assert.deepEqual(props.y2, {scale: Y, field: 'a2'});
      assert.deepEqual(props.x, {scale: X, field: 'b'});
    });
  });

  describe('with nominal x, quantitative y with no y2', () => {
    const model = parseUnitModel({
      "mark": "rule",
      "encoding": {
        "x": {"field": "a", "type": "ordinal"},
        "y": {"field": "b", "type": "quantitative"}
      }
    });

    const props = rule.properties(model);

    it('should create vertical rule that emulates bar chart', function() {
      assert.equal(model.config().mark.orient, 'vertical');

      assert.deepEqual(props.x, {scale: X, field: 'a'});
      assert.deepEqual(props.y, {scale: Y, field: 'b'});
      assert.deepEqual(props.y2, {scale: Y, value: 0});
    });
  });

  describe('with nominal y, quantitative x with no y2', () => {
    const model = parseUnitModel({
      "mark": "rule",
      "encoding": {
        "y": {"field": "a", "type": "ordinal"},
        "x": {"field": "b", "type": "quantitative"}
      }
    });

    const props = rule.properties(model);

    it('should create horizontal rule that emulates bar chart', function() {
      assert.equal(model.config().mark.orient, 'horizontal');

      assert.deepEqual(props.x, {scale: X, field: 'b'});
      assert.deepEqual(props.x2, {scale: X, value: 0 });
      assert.deepEqual(props.y, {scale: Y, field: 'a'});
    });
  });
});