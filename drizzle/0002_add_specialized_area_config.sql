CREATE TABLE IF NOT EXISTS `specialized_area_config` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `clinicId` int NOT NULL,
  `areaKey` varchar(255) NOT NULL,
  `displayName` varchar(255) NOT NULL,
  `description` text,
  `isActive` boolean NOT NULL DEFAULT true,
  `sortOrder` int NOT NULL DEFAULT 0,
  `icon` varchar(255),
  `color` varchar(7),
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_clinic_area_key` (`clinicId`, `areaKey`)
);
