import { cssSelector } from '../src/helpers';

export function getTransformOf(selector, container) {
  return container
    .querySelector(`.${cssSelector(selector)}`)
    .getAttribute('transform')
    .slice('transform('.length, -1)
    .split(', ')
    .map((x) => +x);
}

export function getNumOfWeeks(container) {
  return container.querySelectorAll(`.${cssSelector('week')}`).length;
}
