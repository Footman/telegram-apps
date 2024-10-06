import {
  off,
  on,
  getStorageValue,
  setStorageValue,
  supports,
  type EventListener,
} from '@telegram-apps/bridge';
import { signal } from '@telegram-apps/signals';
import { isPageReload } from '@telegram-apps/navigation';

import { $version, postEvent } from '@/scopes/globals.js';
import { subAndCall } from '@/utils/subAndCall.js';

type StorageValue = boolean;

const MINI_APPS_METHOD = 'web_app_setup_settings_button';
const CLICK_EVENT = 'settings_button_pressed';
const STORAGE_KEY = 'settingsButton';

/**
 * Hides the settings button.
 */
export function hide(): void {
  isVisible.set(false);
}

/**
 * True if the component is currently visible.
 */
export const isVisible = signal(false);

/**
 * True if the component is currently mounted.
 */
export const isMounted = signal(false);

/**
 * @returns True if the settings button is supported.
 */
export function isSupported(): boolean {
  return supports(MINI_APPS_METHOD, $version());
}

/**
 * Mounts the component.
 *
 * This function restores the component state and is automatically saving it in the local storage
 * if it changed.
 */
export function mount(): void {
  if (!isMounted()) {
    isVisible.set(isPageReload() && getStorageValue<StorageValue>(STORAGE_KEY) || false);
    subAndCall(isVisible, onStateChanged);
    isMounted.set(true);
  }
}

function onStateChanged() {
  const value = isVisible();
  postEvent(MINI_APPS_METHOD, { is_visible: value });
  setStorageValue<StorageValue>(STORAGE_KEY, value);
}

/**
 * Add a new settings button click listener.
 * @param fn - event listener.
 * @returns A function to remove bound listener.
 */
export function onClick(fn: EventListener<'settings_button_pressed'>): VoidFunction {
  return on(CLICK_EVENT, fn);
}

/**
 * Removes the settings button click listener.
 * @param fn - an event listener.
 */
export function offClick(fn: EventListener<'settings_button_pressed'>): void {
  off(CLICK_EVENT, fn);
}

/**
 * Shows the settings button.
 */
export function show(): void {
  isVisible.set(true);
}

/**
 * Unmounts the component, removing the listener, saving the component state in the local storage.
 *
 * Note that this function does not remove listeners, added via the `onClick` function.
 * @see onClick
 */
export function unmount() {
  isVisible.unsub(onStateChanged);
  isMounted.set(false);
}