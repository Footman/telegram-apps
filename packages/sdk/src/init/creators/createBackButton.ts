import type { PostEvent } from '@tma.js/bridge';

import { BackButton } from '../../components/index.js';

import { getStorageValue, saveStorageValue } from '../../storage.js';

/**
 * Creates BackButton instance using last locally saved data also saving each state in
 * the storage.
 * @param version - platform version.
 * @param postEvent - Bridge postEvent function
 */
export function createBackButton(version: string, postEvent: PostEvent): BackButton {
  const { isVisible = false } = getStorageValue('back-button') || {};
  const component = new BackButton(isVisible, version, postEvent);

  component.on('isVisibleChanged', () => {
    saveStorageValue('back-button', { isVisible: component.isVisible });
  });

  return component;
}