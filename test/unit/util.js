import {test} from 'zora';
import {kebabToCamel, parse, stringify} from '../../src/util.js';

test('parse a number string should return a number', t => {
    t.eq(parse('1'), 1);
    t.eq(parse('0'), 0);
    t.eq(parse('234'), 234);
    t.eq(parse('3.14159'), 3.14159);
});

test('parse boolean string should return a boolean', t => {
    t.eq(parse('true'), true);
    t.eq(parse('false'), false);
});

test('parse array string should return an array', t => {
    t.eq(parse('[1,true]'), [1, true]);
    t.eq(parse(`["true",'blah']`), ['true', 'blah'], 'should support single quoted string');
    t.eq(parse('["foo",[4, [true]]]'), ['foo', [4, [true]]], 'should support nested array');
});

test('stringify string should return value as it is ', t => {
    t.eq(stringify('foo bar'), 'foo bar');
});

test('stringify boolean', t => {
    t.eq(stringify(true), 'true');
    t.eq(stringify(false), 'false');
});

test('stringify numbers', t => {
    t.eq(stringify(0), '0');
    t.eq(stringify(12), '12');
    t.eq(stringify(3.14159), '3.14159');
});

test('stringify arrays', t => {
    t.eq(stringify([4, true]), '[4,true]');
    t.eq(stringify(['foo', 'bar']), `['foo','bar']`, 'string members should be single quoted');
    t.eq(stringify(['foo', ['bar', [false, 4, 'hello']]]), `['foo',['bar',[false,4,'hello']]]`, 'should work on nexted structure');
});

test('kebab to camel case', t => {
    t.eq(kebabToCamel('circle-radius'), 'circleRadius');
    t.eq(kebabToCamel('circle'), 'circle','single part kebab string');
});

