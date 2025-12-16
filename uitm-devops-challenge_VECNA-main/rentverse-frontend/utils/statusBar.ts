import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export class StatusBarManager {
  /**
   * Initialize status bar with white background and dark text
   */
  static async initializeStatusBar(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Set status bar style to dark (for white background)
        await StatusBar.setStyle({
          style: Style.Dark,
        });

        // Set status bar background to white
        await StatusBar.setBackgroundColor({
          color: '#ffffff',
        });

        // Show status bar
        await StatusBar.show();
      }
    } catch (error) {
      console.warn('Failed to initialize status bar:', error);
    }
  }

  /**
   * Hide status bar
   */
  static async hideStatusBar(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await StatusBar.hide();
      }
    } catch (error) {
      console.warn('Failed to hide status bar:', error);
    }
  }

  /**
   * Show status bar
   */
  static async showStatusBar(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await StatusBar.show();
      }
    } catch (error) {
      console.warn('Failed to show status bar:', error);
    }
  }

  /**
   * Set status bar to dark style (for white background)
   */
  static async setDarkStyle(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await StatusBar.setStyle({
          style: Style.Dark,
        });
      }
    } catch (error) {
      console.warn('Failed to set dark style:', error);
    }
  }

  /**
   * Set status bar to light style (for dark background)
   */
  static async setLightStyle(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await StatusBar.setStyle({
          style: Style.Light,
        });
      }
    } catch (error) {
      console.warn('Failed to set light style:', error);
    }
  }
}