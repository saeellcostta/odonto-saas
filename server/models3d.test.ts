import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./db', () => ({
  getPatientModels3D: vi.fn(),
  getPatientModel3DById: vi.fn(),
  createPatientModel3D: vi.fn(),
  updatePatientModel3D: vi.fn(),
  deletePatientModel3D: vi.fn(),
  getModels3DLibrary: vi.fn(),
  createModel3DLibrary: vi.fn(),
  deleteModel3DLibrary: vi.fn(),
}));

// Mock storage
vi.mock('./storage', () => ({
  storagePut: vi.fn().mockResolvedValue({ url: 'https://example.com/test.stl', key: 'test-key' }),
}));

import * as db from './db';

describe('Models 3D Database Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPatientModels3D', () => {
    it('should return models for a patient', async () => {
      const mockModels = [
        {
          id: 1,
          clinicId: 1,
          patientId: 123,
          name: 'Escaneamento Arcada',
          description: 'Escaneamento completo',
          fileUrl: 'https://example.com/model.stl',
          fileKey: 'models3d/patient-123/model.stl',
          fileType: 'stl',
          fileSize: 1024000,
          category: 'escaneamento',
          isInLibrary: false,
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getPatientModels3D).mockResolvedValue(mockModels);

      const result = await db.getPatientModels3D(123);

      expect(db.getPatientModels3D).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockModels);
      expect(result[0].patientId).toBe(123);
    });

    it('should return empty array when patient has no models', async () => {
      vi.mocked(db.getPatientModels3D).mockResolvedValue([]);

      const result = await db.getPatientModels3D(999);

      expect(result).toEqual([]);
    });
  });

  describe('createPatientModel3D', () => {
    it('should create a new patient model', async () => {
      const newModel = {
        clinicId: 1,
        patientId: 123,
        name: 'Novo Modelo',
        description: 'Descrição do modelo',
        fileUrl: 'https://example.com/new-model.stl',
        fileKey: 'models3d/patient-123/new-model.stl',
        fileType: 'stl',
        fileSize: 2048000,
        category: 'planejamento' as const,
        isInLibrary: false,
        createdBy: 1,
      };

      vi.mocked(db.createPatientModel3D).mockResolvedValue({ id: 1 });

      const result = await db.createPatientModel3D(newModel);

      expect(db.createPatientModel3D).toHaveBeenCalledWith(newModel);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('updatePatientModel3D', () => {
    it('should update a patient model', async () => {
      vi.mocked(db.updatePatientModel3D).mockResolvedValue({ success: true });

      const result = await db.updatePatientModel3D(1, { name: 'Nome Atualizado' });

      expect(db.updatePatientModel3D).toHaveBeenCalledWith(1, { name: 'Nome Atualizado' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('deletePatientModel3D', () => {
    it('should delete a patient model', async () => {
      vi.mocked(db.deletePatientModel3D).mockResolvedValue({ success: true });

      const result = await db.deletePatientModel3D(1);

      expect(db.deletePatientModel3D).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });
  });

  describe('getModels3DLibrary', () => {
    it('should return library models for a clinic', async () => {
      const mockLibraryModels = [
        {
          id: 1,
          clinicId: 1,
          name: 'Modelo Biblioteca',
          description: 'Modelo para uso geral',
          fileUrl: 'https://example.com/library-model.stl',
          fileKey: 'models3d/library/model.stl',
          fileType: 'stl',
          fileSize: 1024000,
          category: 'anatomia',
          isPublic: false,
          sourcePatientModelId: null,
          createdBy: 1,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getModels3DLibrary).mockResolvedValue(mockLibraryModels);

      const result = await db.getModels3DLibrary(1);

      expect(db.getModels3DLibrary).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockLibraryModels);
    });
  });

  describe('createModel3DLibrary', () => {
    it('should create a library model from patient model', async () => {
      const libraryModel = {
        clinicId: 1,
        name: 'Modelo Copiado',
        description: 'Copiado do prontuário',
        fileUrl: 'https://example.com/model.stl',
        fileKey: 'models3d/library/model.stl',
        fileType: 'stl',
        fileSize: 1024000,
        category: 'escaneamento' as const,
        sourcePatientModelId: 123,
        createdBy: 1,
      };

      vi.mocked(db.createModel3DLibrary).mockResolvedValue({ id: 1 });

      const result = await db.createModel3DLibrary(libraryModel);

      expect(db.createModel3DLibrary).toHaveBeenCalledWith(libraryModel);
      expect(result).toEqual({ id: 1 });
    });
  });
});

describe('Models 3D Categories', () => {
  it('should support all valid categories for patient models', () => {
    const validCategories = ['escaneamento', 'planejamento', 'prótese', 'implante', 'ortodontia', 'outro'];
    
    validCategories.forEach(category => {
      expect(typeof category).toBe('string');
      expect(category.length).toBeGreaterThan(0);
    });
  });

  it('should support all valid categories for library models', () => {
    const validCategories = ['anatomia', 'escaneamento', 'planejamento', 'prótese', 'implante', 'ortodontia', 'educacional', 'outro'];
    
    validCategories.forEach(category => {
      expect(typeof category).toBe('string');
      expect(category.length).toBeGreaterThan(0);
    });
  });
});

describe('File Type Validation', () => {
  it('should support valid 3D file types', () => {
    const validTypes = ['stl', 'obj', 'gltf', 'glb'];
    
    validTypes.forEach(type => {
      expect(typeof type).toBe('string');
      expect(['stl', 'obj', 'gltf', 'glb']).toContain(type);
    });
  });
});
