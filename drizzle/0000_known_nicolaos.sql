CREATE TABLE `access_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`name` varchar(100) NOT NULL,
	`description` text,
	`permissions` text,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`patientId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageType` enum('panoramic','periapical','bitewing','cephalometric','intraoral') DEFAULT 'panoramic',
	`analysisResult` text,
	`findings` text,
	`recommendations` text,
	`confidence` decimal(5,2),
	`analyzedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `anamnesis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`heartDisease` boolean DEFAULT false,
	`hypertension` boolean DEFAULT false,
	`diabetes` boolean DEFAULT false,
	`pregnancy` boolean DEFAULT false,
	`allergies` boolean DEFAULT false,
	`allergiesDescription` text,
	`medications` boolean DEFAULT false,
	`medicationsDescription` text,
	`surgeries` boolean DEFAULT false,
	`surgeriesDescription` text,
	`smoker` boolean DEFAULT false,
	`alcohol` boolean DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anamnesis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`patientId` int NOT NULL,
	`dentistId` int,
	`date` date NOT NULL,
	`startTime` time NOT NULL,
	`endTime` time NOT NULL,
	`type` varchar(100),
	`status` enum('scheduled','confirmed','in_progress','completed','cancelled','no_show') DEFAULT 'scheduled',
	`notes` text,
	`chairId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budget_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`budgetId` int NOT NULL,
	`procedureId` int NOT NULL,
	`toothNumber` varchar(10),
	`faces` varchar(20),
	`quantity` int DEFAULT 1,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`status` enum('pending','approved','rejected','in_progress','completed') DEFAULT 'pending',
	`phase` enum('urgent','important','aesthetic','preventive') DEFAULT 'important',
	`priority` int DEFAULT 2,
	`approvedAt` timestamp,
	`rejectedAt` timestamp,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `budget_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`patientId` int NOT NULL,
	`dentistId` int,
	`totalValue` decimal(10,2) NOT NULL,
	`discountPercent` decimal(5,2) DEFAULT '0',
	`discountValue` decimal(10,2) DEFAULT '0',
	`finalValue` decimal(10,2) NOT NULL,
	`status` enum('pending','approved','rejected','in_progress','completed') DEFAULT 'pending',
	`notes` text,
	`validUntil` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chairs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`name` varchar(100) NOT NULL,
	`description` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chairs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checkins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`patientId` int,
	`patientName` varchar(255),
	`phone` varchar(20),
	`reason` text,
	`queueType` enum('budget','dentist','orthodontics','implant','prosthetics') DEFAULT 'budget',
	`status` enum('waiting','called','in_service','completed') DEFAULT 'waiting',
	`checkinTime` timestamp NOT NULL DEFAULT (now()),
	`calledTime` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `checkins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinic_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL DEFAULT 'Minha Clínica',
	`cnpj` varchar(18),
	`cro` varchar(50),
	`phone` varchar(20),
	`email` varchar(320),
	`address` text,
	`city` varchar(100),
	`state` varchar(2),
	`zipCode` varchar(10),
	`openTime` time DEFAULT '08:00:00',
	`closeTime` time DEFAULT '18:00:00',
	`appointmentDuration` int DEFAULT 30,
	`logoUrl` text,
	`logoData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinic_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`cnpj` varchar(18),
	`cro` varchar(50),
	`phone` varchar(20),
	`email` varchar(320),
	`address` text,
	`city` varchar(100),
	`state` varchar(2),
	`zipCode` varchar(10),
	`logoUrl` text,
	`planId` int,
	`subscriptionStatus` enum('trial','active','past_due','canceled','suspended') NOT NULL DEFAULT 'trial',
	`trialEndsAt` timestamp,
	`subscriptionStartedAt` timestamp,
	`subscriptionEndsAt` timestamp,
	`lastPaymentAt` timestamp,
	`nextPaymentAt` timestamp,
	`stripeCustomerId` varchar(100),
	`stripeSubscriptionId` varchar(100),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinics_id` PRIMARY KEY(`id`),
	CONSTRAINT `clinics_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `dentists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`name` varchar(255) NOT NULL,
	`cro` varchar(50) NOT NULL,
	`specialty` varchar(100),
	`phone` varchar(20),
	`email` varchar(320),
	`commission` decimal(5,2) DEFAULT '0',
	`isActive` boolean DEFAULT true,
	`isActiveToday` boolean DEFAULT false,
	`checkedInAt` timestamp,
	`color` varchar(7) DEFAULT '#3B82F6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dentists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ia_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`sources` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ia_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `implant_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`patientId` int NOT NULL,
	`dentistId` int,
	`toothNumber` varchar(50) NOT NULL,
	`implantBrand` varchar(100),
	`implantModel` varchar(100),
	`implantDiameter` decimal(4,2),
	`implantLength` decimal(4,2),
	`boneGraft` boolean DEFAULT false,
	`boneGraftType` varchar(100),
	`sinusLift` boolean DEFAULT false,
	`status` enum('planning','surgery_scheduled','implant_placed','healing','prosthesis_phase','completed') DEFAULT 'planning',
	`surgeryDate` date,
	`healingTime` int DEFAULT 90,
	`prosthesisDate` date,
	`totalValue` decimal(10,2),
	`notes` text,
	`ctScanUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `implant_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insurances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`name` varchar(255) NOT NULL,
	`code` varchar(50),
	`phone` varchar(20),
	`email` varchar(320),
	`discount` decimal(5,2) DEFAULT '0',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insurances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `laboratories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20),
	`email` varchar(320),
	`address` text,
	`contactPerson` varchar(255),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `laboratories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medical_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`patientId` int NOT NULL,
	`dentistId` int,
	`type` enum('atestado','receituario','termo_consentimento','contrato') NOT NULL,
	`attestationType` enum('dias','presenca'),
	`attestationDays` int,
	`includeCid` boolean DEFAULT false,
	`cidCode` varchar(20),
	`prescription` text,
	`consentProcedure` varchar(255),
	`customProcedure` varchar(255),
	`contractProcedures` text,
	`contractValue` decimal(10,2),
	`paymentMethod` varchar(100),
	`contractObservations` text,
	`clinicName` varchar(255),
	`clinicAddress` text,
	`clinicPhone` varchar(20),
	`clinicCnpj` varchar(18),
	`clinicCro` varchar(50),
	`dentistName` varchar(255),
	`dentistCro` varchar(50),
	`patientName` varchar(255),
	`patientCpf` varchar(14),
	`patientAddress` text,
	`patient_signature` text,
	`patient_signed_at` timestamp,
	`professional_signature` text,
	`professional_signed_at` timestamp,
	`validation_token` varchar(64),
	`validation_expires_at` timestamp,
	`documentDate` timestamp NOT NULL,
	`pdfUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medical_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `models_3d_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileType` varchar(20) NOT NULL DEFAULT 'stl',
	`fileSize` int,
	`category` enum('anatomia','escaneamento','planejamento','prótese','implante','ortodontia','educacional','outro') NOT NULL DEFAULT 'anatomia',
	`isPublic` boolean DEFAULT false,
	`sourcePatientModelId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `models_3d_library_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`appointmentReminderEnabled` boolean DEFAULT true,
	`reminderHoursBefore` int DEFAULT 24,
	`queueCallEnabled` boolean DEFAULT true,
	`confirmationEnabled` boolean DEFAULT true,
	`followupEnabled` boolean DEFAULT false,
	`followupDaysAfter` int DEFAULT 7,
	`whatsappApiKey` text,
	`whatsappPhoneId` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`name` varchar(100) NOT NULL,
	`number` varchar(20),
	`floor` varchar(20),
	`description` text,
	`specialties` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orthodontic_maintenances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`treatmentId` int NOT NULL,
	`appointmentId` int,
	`date` date NOT NULL,
	`procedure` text,
	`wireChange` boolean DEFAULT false,
	`wireType` varchar(100),
	`elasticChange` boolean DEFAULT false,
	`elasticType` varchar(100),
	`notes` text,
	`nextAppointmentDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orthodontic_maintenances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orthodontic_treatments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`patientId` int NOT NULL,
	`dentistId` int,
	`type` enum('fixed_braces','invisible_aligner','retainer','expander','other') DEFAULT 'fixed_braces',
	`startDate` date,
	`estimatedEndDate` date,
	`actualEndDate` date,
	`status` enum('planning','active','maintenance','completed','cancelled') DEFAULT 'planning',
	`upperArch` varchar(100),
	`lowerArch` varchar(100),
	`bracketType` varchar(100),
	`notes` text,
	`totalValue` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orthodontic_treatments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`type` enum('image','document','xray','receipt') DEFAULT 'document',
	`name` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `patient_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`category` enum('intraoral','extraoral','radiografia','tomografia','modelo_3d','antes_depois','outros') NOT NULL,
	`title` varchar(255),
	`description` text,
	`imageUrl` text NOT NULL,
	`thumbnailUrl` text,
	`toothNumber` varchar(10),
	`takenAt` timestamp,
	`takenBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patient_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient_models_3d` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`patientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileType` varchar(20) NOT NULL DEFAULT 'stl',
	`fileSize` int,
	`category` enum('escaneamento','planejamento','prótese','implante','ortodontia','outro') NOT NULL DEFAULT 'escaneamento',
	`isInLibrary` boolean DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patient_models_3d_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`transactionId` int,
	`receiptNumber` varchar(50) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paymentMethod` varchar(50),
	`description` text,
	`services` text,
	`dentistId` int,
	`dentistName` varchar(255),
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `patient_receipts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`name` varchar(255) NOT NULL,
	`cpf` varchar(14),
	`rg` varchar(20),
	`birthDate` date,
	`gender` enum('male','female','other'),
	`phone` varchar(20),
	`whatsapp` varchar(20),
	`email` varchar(320),
	`address` text,
	`city` varchar(100),
	`state` varchar(2),
	`zipCode` varchar(10),
	`profession` varchar(100),
	`emergencyContact` varchar(255),
	`emergencyPhone` varchar(20),
	`notes` text,
	`insuranceId` int,
	`photoUrl` text,
	`isActive` boolean DEFAULT true,
	`isActiveToday` boolean DEFAULT false,
	`activatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`billingCycle` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
	`maxUsers` int DEFAULT 5,
	`maxPatients` int DEFAULT 100,
	`maxAppointmentsPerMonth` int DEFAULT 200,
	`hasAIAnalysis` boolean DEFAULT false,
	`hasWhatsAppNotifications` boolean DEFAULT false,
	`hasTVPanel` boolean DEFAULT true,
	`hasAdvancedReports` boolean DEFAULT false,
	`hasMultipleLocations` boolean DEFAULT false,
	`hasAPIAccess` boolean DEFAULT false,
	`hasPrioritySupport` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `procedure_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`name` varchar(100) NOT NULL,
	`color` varchar(7) DEFAULT '#3B82F6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procedure_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `procedures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`code` varchar(20),
	`name` varchar(255) NOT NULL,
	`description` text,
	`categoryId` int,
	`pricePerTooth` decimal(10,2) NOT NULL,
	`priceUpperArch` decimal(10,2),
	`priceLowerArch` decimal(10,2),
	`duration` int DEFAULT 30,
	`isActive` boolean DEFAULT true,
	`faces` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `procedures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prosthesis_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`patientId` int NOT NULL,
	`dentistId` int,
	`laboratoryId` int,
	`prosthesisTypeId` int,
	`toothNumber` varchar(50),
	`color` varchar(50),
	`material` varchar(100),
	`price` decimal(10,2),
	`labCost` decimal(10,2),
	`status` enum('pending','sent_to_lab','in_production','ready','delivered','installed') DEFAULT 'pending',
	`orderDate` date,
	`expectedDate` date,
	`deliveryDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prosthesis_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prosthesis_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`defaultPrice` decimal(10,2),
	`estimatedDays` int DEFAULT 7,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prosthesis_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `queue_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`queueEntryId` int NOT NULL,
	`patientId` int NOT NULL,
	`action` enum('added','called','started','forwarded','payment_requested','payment_received','completed','cancelled') NOT NULL,
	`fromQueue` varchar(50),
	`toQueue` varchar(50),
	`officeId` int,
	`officeName` varchar(100),
	`professionalId` int,
	`professionalName` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `queue_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminder_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`message` text NOT NULL,
	`isDefault` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reminder_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `return_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`patientId` int NOT NULL,
	`treatmentType` varchar(100),
	`lastVisitDate` timestamp NOT NULL,
	`returnDueDate` timestamp NOT NULL,
	`daysUntilReturn` int NOT NULL,
	`status` enum('pending','contacted','scheduled','completed','cancelled') NOT NULL DEFAULT 'pending',
	`contactAttempts` int DEFAULT 0,
	`lastContactDate` timestamp,
	`lastContactNotes` text,
	`scheduledAppointmentId` int,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `return_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `return_period_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`treatmentType` varchar(100) NOT NULL,
	`returnPeriodDays` int NOT NULL,
	`reminderDaysBefore` int DEFAULT 7,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `return_period_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` enum('owner','admin','atendente','dentista','protesista','ortodontista','implantodontista','bucomaxilo','odontopediatria') NOT NULL,
	`canViewPainel` boolean DEFAULT true,
	`canViewAtendente` boolean DEFAULT false,
	`canViewPacientes` boolean DEFAULT false,
	`canViewProntuarios` boolean DEFAULT false,
	`canViewAgenda` boolean DEFAULT false,
	`canViewOrcamentista` boolean DEFAULT false,
	`canViewAreaDentista` boolean DEFAULT false,
	`canViewAreaOrtodontista` boolean DEFAULT false,
	`canViewAreaImplantodontista` boolean DEFAULT false,
	`canViewAreaProtesista` boolean DEFAULT false,
	`canViewAreaBucomaxilo` boolean DEFAULT false,
	`canViewAreaOdontopediatria` boolean DEFAULT false,
	`canViewProcedimentos` boolean DEFAULT false,
	`canViewDentistas` boolean DEFAULT false,
	`canViewProteses` boolean DEFAULT false,
	`canViewFinanceiro` boolean DEFAULT false,
	`canViewConvenios` boolean DEFAULT false,
	`canViewEstoque` boolean DEFAULT false,
	`canViewRelatorios` boolean DEFAULT false,
	`canViewAnaliseIA` boolean DEFAULT false,
	`canViewQRCheckin` boolean DEFAULT false,
	`canViewPainelTV` boolean DEFAULT false,
	`canViewNotificacoes` boolean DEFAULT false,
	`canViewGestaoUsuarios` boolean DEFAULT false,
	`canViewConfiguracoes` boolean DEFAULT false,
	`canViewAdmin` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`patientId` int NOT NULL,
	`patientName` varchar(255) NOT NULL,
	`queueType` enum('reception','budget','dentist','orthodontics','implant','prosthetics') NOT NULL DEFAULT 'reception',
	`status` enum('waiting','called','in_service','pending_payment','completed','forwarded') NOT NULL DEFAULT 'waiting',
	`priority` enum('normal','high','urgent') DEFAULT 'normal',
	`officeId` int,
	`officeName` varchar(100),
	`professionalId` int,
	`professionalName` varchar(255),
	`budgetId` int,
	`budgetValue` decimal(10,2),
	`amountToPay` decimal(10,2),
	`amountPaid` decimal(10,2),
	`paymentStatus` enum('pending','partial','paid') DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`originQueue` varchar(50),
	`originProfessional` varchar(255),
	`nextQueue` varchar(50),
	`notes` text,
	`evaluationNotes` text,
	`arrivalTime` timestamp NOT NULL DEFAULT (now()),
	`calledTime` timestamp,
	`serviceStartTime` timestamp,
	`serviceEndTime` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smile_designs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`patientId` int,
	`originalImageUrl` text NOT NULL,
	`simulatedImageUrl` text NOT NULL,
	`treatmentType` varchar(50) NOT NULL,
	`notes` text,
	`createdBy` int NOT NULL,
	`budgetId` int,
	`converted` boolean DEFAULT false,
	`convertedAt` timestamp,
	`sharedViaWhatsApp` boolean DEFAULT false,
	`sharedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `smile_designs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`name` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`name` varchar(255) NOT NULL,
	`categoryId` int,
	`quantity` int DEFAULT 0,
	`minQuantity` int DEFAULT 10,
	`unit` varchar(20) DEFAULT 'un',
	`costPrice` decimal(10,2),
	`supplier` varchar(255),
	`expirationDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stockItemId` int NOT NULL,
	`type` enum('in','out') NOT NULL,
	`quantity` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`patientId` int,
	`budgetId` int,
	`type` enum('income','expense') NOT NULL,
	`category` varchar(100),
	`description` text,
	`value` decimal(10,2) NOT NULL,
	`paymentMethod` enum('cash','credit_card','debit_card','pix','bank_transfer','check','insurance'),
	`date` date NOT NULL,
	`status` enum('pending','paid','cancelled') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treatment_procedures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`patientId` int NOT NULL,
	`budgetId` int,
	`queueEntryId` int,
	`procedureId` int,
	`procedureName` varchar(255) NOT NULL,
	`toothNumber` varchar(20),
	`faces` varchar(50),
	`condition` varchar(50),
	`price` decimal(10,2),
	`status` enum('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
	`completedBy` int,
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `treatment_procedures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treatments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`toothNumber` varchar(10) NOT NULL,
	`face` varchar(5),
	`condition` enum('healthy','cavity','restoration','extraction','implant','crown','bridge','canal','fracture','absent') DEFAULT 'healthy',
	`procedureId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `treatments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tv_panel_calls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`queueEntryId` int NOT NULL,
	`patientName` varchar(255) NOT NULL,
	`officeName` varchar(100),
	`officeNumber` varchar(20),
	`professionalName` varchar(255),
	`queueType` varchar(50),
	`isActive` boolean DEFAULT true,
	`calledAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `tv_panel_calls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_clinics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clinicId` int NOT NULL,
	`role` enum('owner','admin','atendente','dentista','protesista','ortodontista','implantodontista','bucomaxilo','odontopediatria') NOT NULL DEFAULT 'atendente',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_clinics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`module` varchar(50) NOT NULL,
	`canView` boolean DEFAULT false,
	`canCreate` boolean DEFAULT false,
	`canEdit` boolean DEFAULT false,
	`canDelete` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64),
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255),
	`name` text,
	`phone` varchar(20),
	`loginMethod` varchar(64) DEFAULT 'email',
	`role` enum('user','admin','superadmin') NOT NULL DEFAULT 'user',
	`clinicId` int,
	`isActive` boolean DEFAULT true,
	`emailVerified` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `waiting_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`patientId` int NOT NULL,
	`queueType` enum('budget','dentist','orthodontics','implant','prosthetics') DEFAULT 'dentist',
	`priority` enum('normal','high','urgent') DEFAULT 'normal',
	`status` enum('waiting','in_service','completed','cancelled') DEFAULT 'waiting',
	`arrivalTime` timestamp NOT NULL DEFAULT (now()),
	`startTime` timestamp,
	`endTime` timestamp,
	`dentistId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `waiting_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int,
	`patientId` int,
	`appointmentId` int,
	`phone` varchar(20) NOT NULL,
	`type` enum('appointment_reminder','queue_call','confirmation','followup','custom') DEFAULT 'custom',
	`message` text NOT NULL,
	`status` enum('pending','sent','delivered','read','failed') DEFAULT 'pending',
	`scheduledFor` timestamp,
	`sentAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_reminder_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`returnAlertId` int NOT NULL,
	`patientId` int NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`messageTemplate` varchar(100) NOT NULL,
	`messageContent` text NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`sentBy` int,
	`status` enum('sent','delivered','read','failed') NOT NULL DEFAULT 'sent',
	CONSTRAINT `whatsapp_reminder_history_id` PRIMARY KEY(`id`)
);
