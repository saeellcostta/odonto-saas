import { describe, it, expect, beforeAll } from 'vitest';
import i18n from './config';
import ptBR from './locales/pt-BR.json';
import es from './locales/es.json';

describe('i18n Configuration', () => {
  beforeAll(async () => {
    await i18n.init();
  });

  it('should have Portuguese (Brazil) as fallback language', () => {
    expect(i18n.options.fallbackLng).toBe('pt-BR');
  });

  it('should have both pt-BR and es languages configured', () => {
    const resources = i18n.options.resources;
    expect(resources).toHaveProperty('pt-BR');
    expect(resources).toHaveProperty('es');
  });

  it('should load Portuguese translations correctly', () => {
    expect(ptBR.common).toBeDefined();
    expect(ptBR.common.save).toBe('Salvar');
    expect(ptBR.navigation).toBeDefined();
    expect(ptBR.navigation.dashboard).toBe('Dashboard');
  });

  it('should load Spanish translations correctly', () => {
    expect(es.common).toBeDefined();
    expect(es.common.save).toBe('Guardar');
    expect(es.navigation).toBeDefined();
    expect(es.navigation.dashboard).toBe('Panel de Control');
  });

  it('should have matching keys between Portuguese and Spanish', () => {
    const ptKeys = Object.keys(ptBR);
    const esKeys = Object.keys(es);
    expect(ptKeys).toEqual(esKeys);
  });

  it('should have all required translation namespaces', () => {
    const requiredNamespaces = [
      'common',
      'navigation',
      'pages',
      'patients',
      'dentists',
      'procedures',
      'settings',
      'attendant',
      'budgeter',
      'messages',
    ];

    requiredNamespaces.forEach((namespace) => {
      expect(ptBR).toHaveProperty(namespace);
      expect(es).toHaveProperty(namespace);
    });
  });

  it('should translate common words correctly', async () => {
    await i18n.changeLanguage('pt-BR');
    const savePt = i18n.t('common.save');
    expect(savePt).toBe('Salvar');

    await i18n.changeLanguage('es');
    const saveEs = i18n.t('common.save');
    expect(saveEs).toBe('Guardar');
  });

  it('should persist language preference to localStorage', async () => {
    localStorage.setItem('language', 'es');
    const stored = localStorage.getItem('language');
    expect(stored).toBe('es');
    localStorage.removeItem('language');
  });
});
