import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockSessionStorageGetItem,
  mockPageReload,
  mockSessionStorageSetItem,
} from 'test-utils';
import { emitMiniAppsEvent, TypedError } from '@telegram-apps/bridge';

import { mockPostEvent } from '@test-utils/mockPostEvent.js';
import { resetPackageState } from '@test-utils/reset/reset.js';
import { setInitialized } from '@test-utils/setInitialized.js';
import { mockMiniAppsEnv } from '@test-utils/mockMiniAppsEnv.js';
import { mockSSR } from '@test-utils/mockSSR.js';
import { $version } from '@/scopes/globals.js';

import {
  show,
  hide,
  mount,
  onClick,
  unmount,
  offClick,
  isSupported,
  isVisible,
  isMounted,
} from './back-button.js';

beforeEach(() => {
  resetPackageState();
  vi.restoreAllMocks();
  mockPostEvent();
});

function setAvailable() {
  setInitialized();
  mockMiniAppsEnv();
  isMounted.set(true);
}

describe.each([
  ['hide', hide],
  ['show', show],
  ['mount', mount],
  ['onClick', onClick],
  ['offClick', offClick],
] as const)('%s', (name, fn) => {
  it('should throw ERR_UNKNOWN_ENV if not in Mini Apps', () => {
    const err = new TypedError(
      'ERR_UNKNOWN_ENV',
      `Unable to call the backButton.${name}() method: it can't be called outside Mini Apps`,
    );
    expect(fn).toThrow(err);
    mockMiniAppsEnv();
    expect(fn).not.toThrow(err);
  });

  describe('mini apps env', () => {
    beforeEach(mockMiniAppsEnv);

    it('should throw ERR_UNKNOWN_ENV if called on the server', () => {
      mockSSR();
      expect(fn).toThrow(
        new TypedError(
          'ERR_UNKNOWN_ENV',
          `Unable to call the backButton.${name}() method: it can't be called outside Mini Apps`,
        ),
      );
    });

    it('should throw ERR_NOT_INITIALIZED if package is not initialized', () => {
      const err = new TypedError(
        'ERR_NOT_INITIALIZED',
        `Unable to call the backButton.${name}() method: the SDK was not initialized. Use the SDK init() function`,
      );
      expect(fn).toThrow(err);
      setInitialized();
      expect(fn).not.toThrow(err);
    });

    describe('package initialized', () => {
      beforeEach(setInitialized);

      it('should throw ERR_NOT_SUPPORTED if Mini Apps version is less than 6.1', () => {
        $version.set('6.0');
        expect(fn).toThrow(
          new TypedError(
            'ERR_NOT_SUPPORTED',
            `Unable to call the backButton.${name}() method: it is unsupported in Mini Apps version 6.0`,
          ),
        );
        $version.set('6.1');
        expect(fn).not.toThrow(
          new TypedError(
            'ERR_NOT_SUPPORTED',
            `Unable to call the backButton.${name}() method: it is unsupported in Mini Apps version 6.1`,
          ),
        );
      });
    });
  });

  describe('isSupported', () => {
    it('should return true only if Mini Apps version is 6.1 or higher. False otherwise', () => {
      $version.set('6.0');
      expect(fn.isSupported()).toBe(false);
      $version.set('6.1');
      expect(fn.isSupported()).toBe(true);
    });
  });
});

describe.each([
  ['hide', hide, false],
  ['show', show, true],
])('%s', (name, fn, value) => {
  describe('mini apps env', () => {
    beforeEach(mockMiniAppsEnv);

    describe('package initialized', () => {
      beforeEach(setInitialized);

      describe('Mini Apps version is 6.1', () => {
        beforeEach(() => {
          $version.set('6.1');
        });

        it('should throw ERR_NOT_MOUNTED if backButton is not mounted', () => {
          expect(fn).toThrow(
            new TypedError(
              'ERR_NOT_MOUNTED',
              `Unable to call the backButton.${name}() method: the component is not mounted. Use the backButton.mount() method`,
            ),
          );
        });

        describe('mounted', () => {
          beforeEach(() => {
            isMounted.set(true);
          });

          it('should not throw', () => {
            expect(fn).not.toThrow();
          });
        });
      });
    });
  });

  describe('env is ready', () => {
    beforeEach(setAvailable);

    it(`should set isVisible = ${value}`, () => {
      isVisible.set(!value);
      expect(isVisible()).toBe(!value);
      fn();
      expect(isVisible()).toBe(value);
    });

    it(`should call postEvent with "web_app_setup_back_button" and { is_visible: ${value} }`, () => {
      isVisible.set(!value);
      const spy = mockPostEvent();
      fn();
      fn();
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith('web_app_setup_back_button', { is_visible: value });
    });

    it(`should call sessionStorage.setItem with "tapps/backButton" and "${value}" if value changed`, () => {
      isVisible.set(value);
      const spy = mockSessionStorageSetItem();
      fn();
      // Should call retrieveLaunchParams.
      expect(spy).toHaveBeenCalledOnce();

      spy.mockClear();

      isVisible.set(!value);
      fn();
      // Should call retrieveLaunchParams + save component state.
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(2, 'tapps/backButton', String(value));
    });
  });
});

describe.each([
  ['mount', mount],
  ['onClick', onClick],
  ['offClick', offClick],
] as const)('%s', (_, fn) => {
  describe('mini apps env', () => {
    beforeEach(mockMiniAppsEnv);

    describe('package initialized', () => {
      beforeEach(setInitialized);

      describe('Mini Apps version is 6.1', () => {
        beforeEach(() => {
          $version.set('6.1');
        });

        it('should not throw', () => {
          expect(fn).not.toThrow();
        });
      });
    });
  });
});

describe('isSupported', () => {
  it('should return false if version is less than 6.1', () => {
    $version.set('6.0');
    expect(isSupported()).toBe(false);

    $version.set('6.1');
    expect(isSupported()).toBe(true);
  });
});

describe('mount', () => {
  beforeEach(() => {
    mockMiniAppsEnv();
    setInitialized();
  });

  it('should set isMounted = true', () => {
    expect(isMounted()).toBe(false);
    mount();
    expect(isMounted()).toBe(true);
  });

  describe('page reload', () => {
    beforeEach(() => {
      mockPageReload();
    });

    it('should use value from session storage key "tapps/backButton"', () => {
      const spy = mockSessionStorageGetItem(() => 'true');
      mount();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('tapps/backButton');
      expect(isVisible()).toBe(true);
    });

    it('should set isVisible false if session storage key "tapps/backButton" not presented', () => {
      const spy = mockSessionStorageGetItem(() => null);
      mount();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('tapps/backButton');
      expect(isVisible()).toBe(false);
    });
  });

  describe('first launch', () => {
    it('should set isVisible false', () => {
      mount();
      expect(isVisible()).toBe(false);
    });
  });
});

describe('onClick', () => {
  beforeEach(setAvailable);

  it('should add click listener', () => {
    const fn = vi.fn();
    onClick(fn);
    emitMiniAppsEvent('back_button_pressed', {});
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should remove added listener if returned function was called', () => {
    const fn = vi.fn();
    const off = onClick(fn);
    off();
    emitMiniAppsEvent('back_button_pressed', {});
    expect(fn).toHaveBeenCalledTimes(0);
  });
});

describe('offClick', () => {
  beforeEach(setAvailable);

  it('should remove click listener', () => {
    const fn = vi.fn();
    onClick(fn);
    offClick(fn);
    emitMiniAppsEvent('back_button_pressed', {});
    expect(fn).toHaveBeenCalledTimes(0);
  });
});

describe('unmount', () => {
  beforeEach(setAvailable);

  it('should set isMounted = false', () => {
    expect(isMounted()).toBe(true);
    unmount();
    expect(isMounted()).toBe(false);
  });
});
