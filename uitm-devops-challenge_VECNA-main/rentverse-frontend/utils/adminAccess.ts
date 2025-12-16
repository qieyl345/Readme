/**
 * Hidden Admin Access Utility
 * Provides multiple elegant ways to access admin functionality
 */

interface AdminAccessOptions {
  enableKeyboardShortcuts?: boolean;
  enableConsoleAccess?: boolean;
  enableURLAccess?: boolean;
  enableHiddenClickZones?: boolean;
  adminToken?: string;
}

interface AccessMethod {
  id: string;
  name: string;
  description: string;
  trigger: () => void;
}

class AdminAccessManager {
  private isEnabled: boolean = false;
  private accessMethods: Map<string, AccessMethod> = new Map();
  private adminToken: string = '';
  private eventListeners: any[] = [];

  constructor(private options: AdminAccessOptions = {}) {
    this.adminToken = options.adminToken || this.generateAdminToken();
    this.initializeAccessMethods();
  }

  /**
   * Initialize all access methods
   */
  private initializeAccessMethods() {
    // Method 1: Keyboard Shortcut (Ctrl+Shift+A)
    if (this.options.enableKeyboardShortcuts !== false) {
      this.accessMethods.set('keyboard', {
        id: 'keyboard',
        name: 'Keyboard Shortcut',
        description: 'Press Ctrl+Shift+A on any page',
        trigger: () => this.triggerAdminAccess('keyboard')
      });
    }

    // Method 2: Console Command
    if (this.options.enableConsoleAccess !== false) {
      this.accessMethods.set('console', {
        id: 'console',
        name: 'Console Command',
        description: 'Type: window.adminAccess() in browser console',
        trigger: () => this.triggerAdminAccess('console')
      });
    }

    // Method 3: URL Parameter
    if (this.options.enableURLAccess !== false) {
      this.accessMethods.set('url', {
        id: 'url',
        name: 'URL Access',
        description: 'Add ?admin_access=true to any URL',
        trigger: () => this.triggerAdminAccess('url')
      });
    }

    // Method 4: Hidden Click Zones (on specific elements)
    if (this.options.enableHiddenClickZones !== false) {
      this.accessMethods.set('click', {
        id: 'click',
        name: 'Hidden Click Zone',
        description: 'Triple-click on logo or specific UI elements',
        trigger: () => this.triggerAdminAccess('click')
      });
    }
  }

  /**
   * Enable admin access detection
   */
  enable() {
    if (this.isEnabled) return;

    this.isEnabled = true;
    console.log('🔓 Admin Access Manager enabled');

    // Setup event listeners
    this.setupKeyboardListeners();
    this.setupConsoleAccess();
    this.setupURLDetection();
    this.setupClickDetection();

    // Log available methods
    this.logAvailableMethods();
  }

  /**
   * Disable admin access detection
   */
  disable() {
    if (!this.isEnabled) return;

    this.isEnabled = false;
    this.removeEventListeners();
    console.log('🔒 Admin Access Manager disabled');
  }

  /**
   * Setup keyboard shortcut listeners
   */
  private setupKeyboardListeners() {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+A combination
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        this.accessMethods.get('keyboard')?.trigger();
      }

      // Alternative: Alt+Shift+A
      if (event.altKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        this.accessMethods.get('keyboard')?.trigger();
      }

      // Secret combination: Type "ADMIN" quickly
      this.handleSecretSequence(event);
    };

    document.addEventListener('keydown', handleKeyDown);
    this.eventListeners.push({ element: document, type: 'keydown', handler: handleKeyDown });
  }

  /**
   * Setup console access
   */
  private setupConsoleAccess() {
    if (typeof window !== 'undefined') {
      (window as any).adminAccess = () => {
        this.accessMethods.get('console')?.trigger();
      };

      (window as any).adminHelp = () => {
        this.showAdminHelp();
      };

      (window as any).adminStatus = () => {
        console.log(this.getStatus());
      };
    }
  }

  /**
   * Setup URL parameter detection
   */
  private setupURLDetection() {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('admin_access') === 'true' || urlParams.get('admin') === '1') {
        setTimeout(() => {
          this.accessMethods.get('url')?.trigger();
        }, 1000); // Delay to avoid immediate detection
      }
    }
  }

  /**
   * Setup hidden click zone detection
   */
  private setupClickDetection() {
    let clickCount = 0;
    let clickTimeout: NodeJS.Timeout;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if clicked on admin elements
      if (this.isAdminElement(target)) {
        clickCount++;
        
        if (clickCount === 3) {
          event.preventDefault();
          this.accessMethods.get('click')?.trigger();
          clickCount = 0;
        }
        
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
          clickCount = 0;
        }, 500); // Reset after 500ms
      }
    };

    document.addEventListener('click', handleClick);
    this.eventListeners.push({ element: document, type: 'click', handler: handleClick });
  }

  /**
   * Handle secret key sequence ("ADMIN")
   */
  private keySequence: string[] = [];
  private secretSequence = ['A', 'D', 'M', 'I', 'N'];
  
  private handleSecretSequence(event: KeyboardEvent) {
    this.keySequence.push(event.key.toUpperCase());
    
    // Keep only last 5 keys
    if (this.keySequence.length > this.secretSequence.length) {
      this.keySequence.shift();
    }

    // Check if sequence matches
    if (this.keySequence.join('') === this.secretSequence.join('')) {
      setTimeout(() => {
        this.triggerAdminAccess('secret_sequence');
      }, 100);
    }

    // Reset sequence after delay
    setTimeout(() => {
      this.keySequence = [];
    }, 2000);
  }

  /**
   * Check if element should trigger admin access
   */
  private isAdminElement(element: HTMLElement): boolean {
    const adminSelectors = [
      '[data-admin-trigger]', // Explicit admin trigger
      '.logo', '.brand', '.app-title', // Brand elements
      'h1', 'h2', '.page-title', // Title elements
      '.nav-brand', '.header-logo' // Navigation elements
    ];

    return adminSelectors.some(selector => 
      element.matches(selector) || element.closest(selector)
    );
  }

  /**
   * Trigger admin access
   */
  private triggerAdminAccess(method: string) {
    const timestamp = new Date().toISOString();
    console.log(`🎯 Admin access triggered via: ${method} at ${timestamp}`);

    // Dispatch custom event for admin access
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adminAccess', {
        detail: {
          method,
          timestamp,
          token: this.adminToken
        }
      }));
    }

    // Log access attempt
    this.logAdminAccess(method, timestamp);
  }

  /**
   * Log admin access attempt
   */
  private logAdminAccess(method: string, timestamp: string) {
    if (typeof window !== 'undefined') {
      const logData = {
        method,
        timestamp,
        userAgent: navigator.userAgent,
        url: window.location.href,
        token: this.adminToken
      };

      console.log('📊 Admin Access Log:', logData);
    }
  }

  /**
   * Show admin help in console
   */
  private showAdminHelp() {
    console.log(`
🔓 ADMIN ACCESS HELP
===================

Available Access Methods:
${Array.from(this.accessMethods.values()).map(method => 
  `• ${method.name}: ${method.description}`
).join('\n')}

Console Commands:
• adminAccess() - Trigger admin access
• adminHelp() - Show this help
• adminStatus() - Show current status

Token: ${this.adminToken}
    `);
  }

  /**
   * Generate admin token
   */
  private generateAdminToken(): string {
    return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log available methods to console
   */
  private logAvailableMethods() {
    console.log(`
🎯 ADMIN ACCESS AVAILABLE
========================

Methods: ${this.accessMethods.size}
Quick Access: Press Ctrl+Shift+A or type adminAccess() in console
Help: Type adminHelp() in console
    `);
  }

  /**
   * Remove all event listeners
   */
  private removeEventListeners() {
    this.eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this.eventListeners = [];
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      methods: Array.from(this.accessMethods.values()),
      adminToken: this.adminToken,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate admin token
   */
  validateToken(token: string): boolean {
    return token === this.adminToken;
  }
}

export default AdminAccessManager;