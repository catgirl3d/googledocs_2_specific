import test from 'node:test';
import assert from 'node:assert/strict';
import { GoogleDocsCleaner } from './script.js';

const boldSpan = (content) => `<span style="font-weight:700">${content}</span>`;

test('limits empty paragraph output to the normal two-break separator', () => {
    const input = [
        `<p>${boldSpan('Первый абзац')}</p>`,
        '<p><br /></p>',
        `<p>${boldSpan('Второй абзац')}</p>`
    ].join('');

    assert.equal(
        GoogleDocsCleaner.clean(input),
        '<strong>Первый абзац</strong><br><br><strong>Второй абзац</strong>'
    );
});

test('keeps the existing two-break separator between regular paragraphs', () => {
    const input = `<p>${boldSpan('Первый абзац')}</p><p>Второй абзац</p>`;

    assert.equal(
        GoogleDocsCleaner.clean(input),
        '<strong>Первый абзац</strong><br><br>Второй абзац'
    );
});

test('merges adjacent bold spans and preserves a separating space', () => {
    const input = `<p>${boldSpan('Первое')} ${boldSpan('слово')}</p>`;

    assert.equal(
        GoogleDocsCleaner.clean(input),
        '<strong>Первое слово</strong>'
    );
});

test('merges adjacent bold spans without adding a separator', () => {
    const input = `<p>${boldSpan('Что будет')}${boldSpan(':')}</p>`;

    assert.equal(
        GoogleDocsCleaner.clean(input),
        '<strong>Что будет:</strong>'
    );
});

test('removes an outer b wrapper while keeping inner strong formatting', () => {
    const input = '<b><strong>Заголовок</strong><br><br>Обычный текст<br><br><strong>Акцент</strong></b>';

    assert.equal(
        GoogleDocsCleaner.clean(input),
        '<strong>Заголовок</strong><br><br>Обычный текст<br><br><strong>Акцент</strong>'
    );
});

test('removes an outer strong wrapper from the complete fragment', () => {
    const input = '<strong>Весь текст<br><br>в одном выделении</strong>';

    assert.equal(
        GoogleDocsCleaner.clean(input),
        'Весь текст<br><br>в одном выделении'
    );
});
