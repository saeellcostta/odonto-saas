import { describe, it, expect } from 'vitest';
import ptBR from '../client/src/i18n/locales/pt-BR.json';
import es from '../client/src/i18n/locales/es.json';

describe('i18n Translations', () => {
  it('should load Portuguese translations', () => {
    expect(ptBR).toBeDefined();
    expect(ptBR.common).toBeDefined();
    expect(ptBR.navigation).toBeDefined();
  });

  it('should load Spanish translations', () => {
    expect(es).toBeDefined();
    expect(es.common).toBeDefined();
    expect(es.navigation).toBeDefined();
  });

  it('should have matching keys between Portuguese and Spanish', () => {
    const ptKeys = Object.keys(ptBR).sort();
    const esKeys = Object.keys(es).sort();
    expect(ptKeys).toEqual(esKeys);
  });

  it('should have common translations', () => {
    expect(ptBR.common.save).toBe('Salvar');
    expect(es.common.save).toBe('Guardar');
    
    expect(ptBR.common.cancel).toBe('Cancelar');
    expect(es.common.cancel).toBe('Cancelar');
  });

  it('should have navigation translations', () => {
    expect(ptBR.navigation.dashboard).toBe('Dashboard');
    expect(es.navigation.dashboard).toBe('Panel de Control');
    
    expect(ptBR.navigation.patients).toBe('Pacientes');
    expect(es.navigation.patients).toBe('Pacientes');
  });

  it('should have all required namespaces', () => {
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

  it('should have settings translations for language', () => {
    expect(ptBR.settings.language).toBe('Idioma');
    expect(es.settings.language).toBe('Idioma');
  });

  it('should have all common keys in both languages', () => {
    const ptCommonKeys = Object.keys(ptBR.common).sort();
    const esCommonKeys = Object.keys(es.common).sort();
    expect(ptCommonKeys).toEqual(esCommonKeys);
  });
});
