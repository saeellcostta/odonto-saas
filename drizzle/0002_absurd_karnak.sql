CREATE TABLE `completed_appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`appointmentId` int,
	`dentistId` int NOT NULL,
	`patientId` int NOT NULL,
	`procedureId` int NOT NULL,
	`procedureName` varchar(255) NOT NULL,
	`procedurePrice` decimal(10,2) NOT NULL,
	`commissionPercentage` decimal(5,2) NOT NULL,
	`commissionAmount` decimal(10,2) NOT NULL,
	`completedAt` timestamp NOT NULL,
	`paymentStatus` enum('pending','paid','cancelled') DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `completed_appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_earnings_summary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`dentistId` int NOT NULL,
	`date` date NOT NULL,
	`totalProcedures` int DEFAULT 0,
	`totalRevenue` decimal(10,2) DEFAULT '0',
	`totalCommission` decimal(10,2) DEFAULT '0',
	`status` enum('draft','finalized','paid') DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_earnings_summary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dentist_commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`dentistId` int NOT NULL,
	`procedureId` int,
	`commissionPercentage` decimal(5,2) NOT NULL,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dentist_commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `checkins` MODIFY COLUMN `queueType` enum('budget','dentist','orthodontics','implant','prosthetics','maxillofacial','pediatric') DEFAULT 'budget';--> statement-breakpoint
ALTER TABLE `service_queue` MODIFY COLUMN `queueType` enum('reception','budget','dentist','orthodontics','implant','prosthetics','maxillofacial','pediatric') NOT NULL DEFAULT 'reception';--> statement-breakpoint
ALTER TABLE `waiting_queue` MODIFY COLUMN `queueType` enum('budget','dentist','orthodontics','implant','prosthetics','maxillofacial','pediatric') DEFAULT 'dentist';--> statement-breakpoint
ALTER TABLE `ai_analysis` ADD `imageHash` varchar(64);--> statement-breakpoint
ALTER TABLE `medical_documents` ADD `patientSignature` text;--> statement-breakpoint
ALTER TABLE `medical_documents` ADD `patientSignedAt` timestamp;--> statement-breakpoint
ALTER TABLE `medical_documents` ADD `professionalSignature` text;--> statement-breakpoint
ALTER TABLE `medical_documents` ADD `professionalSignedAt` timestamp;--> statement-breakpoint
ALTER TABLE `medical_documents` DROP COLUMN `patient_signature`;--> statement-breakpoint
ALTER TABLE `medical_documents` DROP COLUMN `patient_signed_at`;--> statement-breakpoint
ALTER TABLE `medical_documents` DROP COLUMN `professional_signature`;--> statement-breakpoint
ALTER TABLE `medical_documents` DROP COLUMN `professional_signed_at`;