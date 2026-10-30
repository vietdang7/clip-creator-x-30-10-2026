import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../App';
import {
  VISUAL_STYLES,
  PRESET_PROJECTS,
  INITIAL_ACCOUNTS_STATE,
  SUPPORTED_LANGUAGES,
  generateWordTimestampsFromScript,
} from '../data/presetProjects';
import {
  generateShotBlenderScript,
  generateFullProjectBlenderScript,
} from '../services/blenderScriptGenerator';
import {
  DEFAULT_NEW_PROJECT_SETTINGS,
  calculateBuildTelemetry,
  selectOrRotateClaudeAccount,
  buildProviderExecutionPlan,
} from '../services/aiPipelineService';

describe('Creatorize Studio — 100% Feature & Settings Verification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the main studio with default Zack D. 3D Glass Bottle project and Opus 5.5 (LOW) settings', () => {
    render(<App />);

    expect(screen.getByText('Creatorize Studio')).toBeInTheDocument();
    expect(screen.getByTestId('summary-style-name')).toHaveTextContent(
      '3D Informational (Zack D. like)'
    );
    expect(screen.getByTestId('summary-model-effort')).toHaveTextContent('Opus 5.5 (LOW)');
    expect(screen.getByTestId('summary-quality-mode')).toHaveTextContent('Ultra Edit Pass');
    expect(screen.getByTestId('summary-timelimit-duration')).toHaveTextContent('UNLIMITED • 30s');
    expect(screen.getByTestId('telemetry-tokens')).toHaveTextContent('5.4M Tokens');
  });

  it('provides 30+ supported languages (34 languages) per Part 5 Premium specification', () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(30);
    expect(SUPPORTED_LANGUAGES).toContain('Tiếng Việt (Vietnamese)');
    expect(SUPPORTED_LANGUAGES).toContain('English (US)');
    expect(SUPPORTED_LANGUAGES).toContain('日本語 (Japanese)');
  });

  it('exposes all 8 visual styles from the transcript and validates Sonnet 5.5, Max Effort, and Gaslight Claude time limit telemetry', () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('btn-open-project-settings'));

    // Verify all 8 styles exist
    expect(VISUAL_STYLES).toHaveLength(8);
    for (const style of VISUAL_STYLES) {
      expect(screen.getByTestId(`style-card-${style.id}`)).toBeInTheDocument();
    }

    // Select Sonnet 5.5 and verify spatial awareness warning appears
    fireEvent.click(screen.getByTestId('model-select-sonnet'));
    expect(screen.getByTestId('sonnet-spatial-warning')).toBeInTheDocument();

    // Switch back to Opus 5.5
    fireEvent.click(screen.getByTestId('model-select-opus'));
    expect(screen.queryByTestId('sonnet-spatial-warning')).not.toBeInTheDocument();

    // Select Max effort level and verify red slowness warning appears
    fireEvent.click(screen.getByTestId('effort-level-max'));
    expect(screen.getByTestId('max-effort-warning')).toBeInTheDocument();

    // Keep Low effort and set 30m Gaslight Claude time limit -> token count decreases from 5.4M to 4.1M
    fireEvent.click(screen.getByTestId('effort-level-low'));
    fireEvent.change(screen.getByTestId('select-time-limit'), { target: { value: '30m' } });

    // Enable Reference Video and verify editable reference filename input appears
    const refCheckbox = screen.getByTestId('checkbox-reference-video') as HTMLInputElement;
    fireEvent.click(refCheckbox);
    expect(screen.getByTestId('input-reference-video-name')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-save-project-settings'));

    expect(screen.getByTestId('summary-model-effort')).toHaveTextContent('Opus 5.5 (LOW)');
    expect(screen.getByTestId('summary-timelimit-duration')).toHaveTextContent('30M • 30s');
    // Gaslighting Claude with 30m limit reduces tokens from 5.4M -> 4.1M
    expect(screen.getByTestId('telemetry-tokens')).toHaveTextContent('4.1M Tokens');
  });

  it('resets New Project settings to clean tutorial defaults even after viewing Mount Everest (no settings bleed)', () => {
    render(<App />);

    // Switch to Mount Everest preset (which has useReferenceVideo: true and duration: 36s)
    fireEvent.change(screen.getByTestId('select-active-project'), {
      target: { value: 'proj-mount-everest' },
    });
    expect(screen.getByTestId('telemetry-tokens')).toHaveTextContent('10.0M Tokens');

    // Click New Project -> should use clean DEFAULT_NEW_PROJECT_SETTINGS (30s, Audio-Only)
    fireEvent.click(screen.getByTestId('btn-new-project'));
    const refCheckbox = screen.getByTestId('checkbox-reference-video') as HTMLInputElement;
    expect(refCheckbox.checked).toBe(false);

    fireEvent.change(screen.getByTestId('input-project-name'), {
      target: { value: 'Submarine Pressure Hull Physics' },
    });
    fireEvent.change(screen.getByTestId('textarea-script-input'), {
      target: {
        value:
          'At four thousand meters deep, ocean water crushes steel hulls. Titanium spheres distribute hydrostatic pressure evenly. Syntactic foam fills the outer hull cavities. Viewing ports use thick conical acrylic blocks. Emergency ballast tanks blow compressed air to surface. Submarines ascend safely.',
      },
    });
    fireEvent.click(screen.getByTestId('btn-save-project-settings'));

    // Newly created project has 30s duration and un-timed audio initially
    expect(screen.getByTestId('summary-timelimit-duration')).toHaveTextContent('UNLIMITED • 30s');
    expect(screen.getByTestId('audio-timed-status')).toHaveTextContent('Chưa đồng bộ');

    // Step 1: Clean and time the audio
    fireEvent.click(screen.getByTestId('btn-clean-time-audio'));
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(screen.getByTestId('audio-timed-status')).toHaveTextContent('Synced (20s) ✓');

    // Step 2: Open Storyboard, select 6 moments, click Make the stills, confirm & Start build
    fireEvent.click(screen.getByTestId('btn-open-storyboard'));
    fireEvent.click(screen.getByTestId('moments-btn-6'));
    expect(screen.getByTestId('btn-use-those-stills')).toHaveTextContent('Use those six');

    fireEvent.click(screen.getByTestId('btn-make-the-stills'));
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Verify custom stills were generated from the submarine script
    expect(screen.getAllByText(/At four thousand meters deep/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByTestId('btn-use-those-stills'));
    expect(screen.getByTestId('btn-use-those-stills')).toHaveTextContent('Đã xác nhận');

    fireEvent.click(screen.getByTestId('btn-start-build'));
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Timeline should now have 6 shots generated from the custom storyboard stills
    expect(screen.getByTestId('timeline-shot-6')).toBeInTheDocument();
  });

  it('loads distinct project-specific Storyboard stills for Glass Bottle, Mount Everest, and Bullet Mechanism', () => {
    expect(PRESET_PROJECTS[0].storyboardStills.length).toBeGreaterThanOrEqual(5);
    expect(PRESET_PROJECTS[1].storyboardStills.length).toBeGreaterThanOrEqual(5);
    expect(PRESET_PROJECTS[2].storyboardStills.length).toBeGreaterThanOrEqual(5);

    expect(PRESET_PROJECTS[1].storyboardStills[0].title).toContain('Everest');
    expect(PRESET_PROJECTS[2].storyboardStills[0].title).toContain('Firing Pin');

    render(<App />);
    // Switch to Bullet Mechanism project and open Storyboard
    fireEvent.change(screen.getByTestId('select-active-project'), {
      target: { value: 'proj-bullet-mechanism' },
    });
    fireEvent.click(screen.getByTestId('btn-open-storyboard'));
    expect(screen.getByTestId('still-card-still-bullet-1a')).toHaveTextContent('Firing Pin');
  });

  it('enforces 3D Viewport Solid View vs Rendered Preview caching for 3D styles while allowing real-time playback for 2D styles', () => {
    render(<App />);

    // Shot #1 is cached initially -> no cache overlay
    expect(screen.queryByTestId('viewport-cache-overlay')).not.toBeInTheDocument();

    // Click Shot #3 (initially uncached) while in Rendered Preview mode on 3D style
    fireEvent.click(screen.getByTestId('timeline-shot-3'));
    expect(screen.getByTestId('viewport-cache-overlay')).toBeInTheDocument();

    // Switching to Solid View hides the cache block for real-time playback
    fireEvent.click(screen.getByTestId('shading-mode-solid'));
    expect(screen.queryByTestId('viewport-cache-overlay')).not.toBeInTheDocument();

    // Switch back to Rendered Preview -> cache overlay returns for 3D style
    fireEvent.click(screen.getByTestId('shading-mode-rendered'));
    expect(screen.getByTestId('viewport-cache-overlay')).toBeInTheDocument();

    // Switch project style to 2D Pixel Art -> 2D styles play in real-time without 3D cache overlay!
    fireEvent.click(screen.getByTestId('btn-open-project-settings'));
    fireEvent.click(screen.getByTestId('style-card-pixel-art'));
    fireEvent.click(screen.getByTestId('btn-save-project-settings'));

    expect(screen.queryByTestId('viewport-cache-overlay')).not.toBeInTheDocument();

    // Switch back to 3D Informational (Zack D. like) and force-cache Shot #3
    fireEvent.click(screen.getByTestId('btn-open-project-settings'));
    fireEvent.click(screen.getByTestId('style-card-3d-informational-zack-d'));
    fireEvent.click(screen.getByTestId('btn-save-project-settings'));

    expect(screen.getByTestId('viewport-cache-overlay')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-force-cache-shot'));
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByTestId('viewport-cache-overlay')).not.toBeInTheDocument();
  });

  it('enforces Standard Plan (max 12 videos/mo, Standard Verified only) vs Premium Plan', () => {
    render(<App />);

    // Initially Premium with Ultra Edit Pass
    expect(screen.getByTestId('summary-quality-mode')).toHaveTextContent('Ultra Edit Pass');

    // Open Plans & Routines modal via top header badge and switch to Standard Plan
    fireEvent.click(screen.getByTestId('badge-subscription-tier'));
    fireEvent.click(screen.getByTestId('select-tier-standard'));

    // Standard plan downgrades Ultra Edit to Standard Verified and displays 3/12 VIDEOS/MO
    expect(screen.getByTestId('summary-quality-mode')).toHaveTextContent('Standard Verified');
    expect(screen.getByTestId('badge-subscription-tier')).toHaveTextContent(/3\/12 VIDEOS\/MO/i);
  });

  it('manages Multi-Claude Accounts Pool, automatic quota failover, new Video Model accounts, Routines, Custom Styles, and 3-Video Comparison', () => {
    render(<App />);

    // Open Accounts Manager Modal
    fireEvent.click(screen.getByTestId('btn-open-accounts'));
    fireEvent.change(screen.getByTestId('input-new-claude-label'), {
      target: { value: 'Claude 20x Account #4' },
    });
    fireEvent.click(screen.getByTestId('btn-add-claude-account'));
    fireEvent.click(screen.getByTestId('btn-rotate-claude-account'));

    // Add a new Video Model account in the Video Model section
    fireEvent.change(screen.getByTestId('input-new-video-account-name'), {
      target: { value: 'Wan 3.0 Studio Cluster' },
    });
    fireEvent.click(screen.getByTestId('btn-add-video-account'));
    expect(screen.getByDisplayValue('Wan 3.0 Studio Cluster')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-save-accounts'));

    // Verify automatic Claude account failover when quota hits 100%
    const exhaustedState = {
      ...INITIAL_ACCOUNTS_STATE,
      autoSwitchClaudeAccount: true,
      claudeAccounts: INITIAL_ACCOUNTS_STATE.claudeAccounts.map((acc, idx) =>
        idx === 0
          ? { ...acc, sessionUsedPercent: 98, isActive: true }
          : { ...acc, isActive: false }
      ),
    };
    const rotated = selectOrRotateClaudeAccount(exhaustedState, 4.0, 1.0);
    expect(rotated.switchedFromLabel).toBeDefined();
    expect(rotated.activeAccount?.id).toBe('claude-acc-2');

    // Open Routines & Custom Styles Modal
    fireEvent.click(screen.getByTestId('btn-open-routines'));
    fireEvent.click(screen.getByTestId('tab-btn-routines'));
    fireEvent.change(screen.getByTestId('input-routine-name'), {
      target: { value: 'Nightly 3D Physics Shorts' },
    });
    fireEvent.click(screen.getByTestId('btn-add-routine'));
    expect(screen.getByText('Nightly 3D Physics Shorts')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tab-btn-custom-styles'));
    fireEvent.click(screen.getByTestId('btn-style-from-scratch'));
    fireEvent.change(screen.getByTestId('input-custom-style-name'), {
      target: { value: 'Brand New Neon Grid Style' },
    });
    fireEvent.click(screen.getByTestId('btn-save-custom-style'));
    expect(screen.getByText('Brand New Neon Grid Style')).toBeInTheDocument();

    // Open Side-by-Side Comparison Showcase and load Everest project
    fireEvent.click(screen.getByTestId('btn-open-comparison'));
    fireEvent.click(screen.getByTestId('compare-proj-btn-proj-mount-everest'));
    fireEvent.click(screen.getByTestId('btn-load-comparison-project'));

    expect(screen.getByTestId('telemetry-tokens')).toHaveTextContent('10.0M Tokens');
  });

  it('generates scene-specific Blender Python scripts and respects 4K, 16:9, CYCLES, and Custom Avatar options', () => {
    // Edge case: empty script string
    const emptyWords = generateWordTimestampsFromScript('   ', 30, 30);
    expect(emptyWords).toEqual([]);

    // Everest scene script check
    const everestScript = generateShotBlenderScript(
      PRESET_PROJECTS[1].shots[0],
      PRESET_PROJECTS[1].settings.globalStyleKey,
      60,
      {
        resolution: '4K',
        aspectRatio: '16:9',
        renderEngine: 'CYCLES',
        customAvatarName: 'Explorer Bot',
      }
    );
    expect(everestScript).toContain('ContinentalCrustSlab_1');
    expect(everestScript).toContain('MountEverestPeak_1');
    expect(everestScript).toContain('scene.render.resolution_x = 3840');
    expect(everestScript).toContain('scene.render.resolution_y = 2160');
    expect(everestScript).toContain("scene.render.engine = 'CYCLES'");
    expect(everestScript).toContain('Explorer Bot');

    // Bullet scene script check
    const bulletScript = generateFullProjectBlenderScript(PRESET_PROJECTS[2], 'EEVEE_NEXT');
    expect(bulletScript).toContain('BrassCartridgeCutaway_1');
    expect(bulletScript).toContain('CopperProjectile_1');

    // Telemetry & Provider Execution Plan checks
    const sonnetTelemetry = calculateBuildTelemetry({
      ...DEFAULT_NEW_PROJECT_SETTINGS,
      aiModel: 'claude-sonnet-5-5',
      qualityMode: 'ultra-edit',
    });
    const opusTelemetry = calculateBuildTelemetry({
      ...DEFAULT_NEW_PROJECT_SETTINGS,
      aiModel: 'claude-opus-5-5',
      qualityMode: 'ultra-edit',
    });
    expect(sonnetTelemetry.tokensUsedMillions).toBeGreaterThan(opusTelemetry.tokensUsedMillions);

    const plan = buildProviderExecutionPlan(PRESET_PROJECTS[0], INITIAL_ACCOUNTS_STATE);
    expect(plan.length).toBeGreaterThanOrEqual(4);
    expect(plan[2].accountUsed).toContain('Claude 20x Max');
    expect(plan[3].endpointOrCommand).toContain('_opus55_blender.py');
  });
});


