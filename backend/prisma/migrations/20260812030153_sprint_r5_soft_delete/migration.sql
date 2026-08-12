-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "documentCpf" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "socialName" TEXT,
    "cpf" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "bondType" TEXT NOT NULL DEFAULT 'VOLUNTEER',
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminatedAt" TIMESTAMP(3),
    "profession" TEXT,
    "specialty" TEXT,
    "councilNumber" TEXT,
    "councilState" TEXT,
    "councilStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalDocument" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProfessionalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalProject" (
    "professionalId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProfessionalProject_pkey" PRIMARY KEY ("professionalId","projectId")
);

-- CreateTable
CREATE TABLE "TriageQueue" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TriageQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "openedById" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "closureReason" TEXT,
    "evolutionSummary" TEXT,
    "resultsAchieved" TEXT,
    "finalInstructions" TEXT,
    "reopenedAt" TIMESTAMP(3),
    "reopenedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseProfessional" (
    "caseId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PRIMARY_CLINICIAN',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseProfessional_pkey" PRIMARY KEY ("caseId","professionalId")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "beneficiaryId" TEXT,
    "professionalId" TEXT NOT NULL,
    "projectId" TEXT,
    "resourceRoomId" TEXT,
    "meetingLink" TEXT,
    "channelType" TEXT,
    "cancellationReason" TEXT,
    "cancelledBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ResourceRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistQueue" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "requestedSpecialty" TEXT NOT NULL,
    "priorityScore" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anamnesis" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "chiefComplaint" TEXT NOT NULL,
    "historyPersonal" TEXT,
    "historyFamily" TEXT,
    "historySocial" TEXT,
    "historySchool" TEXT,
    "historyOcupational" TEXT,
    "medicinesAlergies" TEXT,
    "structuredData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Anamnesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalEvolution" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "clinicalDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "modality" TEXT NOT NULL,
    "contentEncrypted" TEXT NOT NULL,
    "summary" TEXT,
    "formatType" TEXT NOT NULL DEFAULT 'FREE_TEXT',
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE_TO_AUTHOR',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "digitalSignatureHash" TEXT,
    "signatureMetadata" JSONB,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ClinicalEvolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolutionErrata" (
    "id" TEXT NOT NULL,
    "evolutionId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "correctionTextEncrypted" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "digitalSignatureHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvolutionErrata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "classificationSystem" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "diagnosticStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "clinicalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalDocument" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "evolutionId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentEncrypted" TEXT NOT NULL,
    "digitalSignatureHash" TEXT,
    "signedAt" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ClinicalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalAttachment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileS3Key" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE_TO_AUTHOR',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionUntil" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ClinicalAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAccessLog" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "justification" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttachmentAccessLog" (
    "id" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "justification" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttachmentAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalScale" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "scaleName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "interpretation" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ClinicalScale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetEntity" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "justification" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndividualCarePlan" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "generalObjectives" TEXT NOT NULL,
    "specificObjectives" TEXT NOT NULL,
    "familyCommitments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "signedById" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "IndividualCarePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PicGoal" (
    "id" TEXT NOT NULL,
    "picId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "intervention" TEXT NOT NULL,
    "indicator" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "responsibleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PicGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PicVersion" (
    "id" TEXT NOT NULL,
    "picId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changedById" TEXT NOT NULL,
    "changeSummary" TEXT NOT NULL,
    "contentSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PicVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseMeeting" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "agenda" TEXT NOT NULL,
    "minutes" TEXT NOT NULL,
    "decisions" TEXT NOT NULL,
    "pendingTasks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CaseMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseMeetingParticipant" (
    "meetingId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "role" TEXT,
    "attended" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CaseMeetingParticipant_pkey" PRIMARY KEY ("meetingId","professionalId")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseAlert" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CaseAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "FinancialCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "categoryId" TEXT NOT NULL,
    "projectId" TEXT,
    "donorId" TEXT,
    "campaignId" TEXT,
    "agreementId" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionCostCenter" (
    "transactionId" TEXT NOT NULL,
    "costCenterId" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 100.0,

    CONSTRAINT "TransactionCostCenter_pkey" PRIMARY KEY ("transactionId","costCenterId")
);

-- CreateTable
CREATE TABLE "Donor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "type" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Donor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "raisedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "grantor" TEXT NOT NULL,
    "approvedAmount" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgreementObligation" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,

    CONSTRAINT "AgreementObligation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialReconciliation" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "bankStatementId" TEXT NOT NULL,
    "reconciledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reconciledById" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "FinancialReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtectedProfile" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "internalCode" TEXT NOT NULL,
    "sensitivityLevel" INTEGER NOT NULL DEFAULT 0,
    "specialCategory" TEXT,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "riskHeuristics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProtectedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecureVault" (
    "id" TEXT NOT NULL,
    "protectedProfileId" TEXT NOT NULL,
    "encryptedCpf" TEXT,
    "encryptedAddress" TEXT,
    "encryptedPhone" TEXT,
    "encryptedFamilyDetails" TEXT,
    "encryptedWorkplace" TEXT,
    "encryptedAlternateAddrs" TEXT,
    "encryptedCourtDocs" TEXT,
    "ivMap" JSONB NOT NULL,
    "keyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecureVault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildGuardian" (
    "id" TEXT NOT NULL,
    "protectedProfileId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "custodyType" TEXT NOT NULL,
    "phone" TEXT,
    "isAuthorized" BOOLEAN NOT NULL DEFAULT false,
    "isProhibited" BOOLEAN NOT NULL DEFAULT false,
    "courtOrderDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtectedMeasure" (
    "id" TEXT NOT NULL,
    "protectedProfileId" TEXT NOT NULL,
    "processNumber" TEXT NOT NULL,
    "measureType" TEXT NOT NULL,
    "issuingAuthority" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "restrictionsText" TEXT NOT NULL,
    "involvedPersons" JSONB NOT NULL,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProtectedMeasure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL,
    "protectedProfileId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "processNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "authorizedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessSession" (
    "id" TEXT NOT NULL,
    "protectedProfileId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "accessRequestId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "actionsPerformed" JSONB NOT NULL,

    CONSTRAINT "AccessSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogSignature" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "logHash" TEXT NOT NULL,
    "previousLogHash" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehaviorAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "BehaviorAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "supportsVideo" BOOLEAN NOT NULL DEFAULT false,
    "supportsAudio" BOOLEAN NOT NULL DEFAULT false,
    "supportsChat" BOOLEAN NOT NULL DEFAULT false,
    "supportsNotify" BOOLEAN NOT NULL DEFAULT true,
    "configSchema" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationAccount" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'PRODUCTION',
    "vaultPath" TEXT NOT NULL,
    "webhookUrl" TEXT,
    "webhookSecretHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastHealthCheck" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentChannel" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "channelType" TEXT NOT NULL,
    "providerId" TEXT,
    "accountId" TEXT,
    "selectedByUserId" TEXT,
    "preferenceSource" TEXT NOT NULL DEFAULT 'INSTITUTIONAL',
    "isFallback" BOOLEAN NOT NULL DEFAULT false,
    "originalChannelType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalMeeting" (
    "id" TEXT NOT NULL,
    "appointmentChannelId" TEXT NOT NULL,
    "externalMeetingId" TEXT NOT NULL,
    "joinUrl" TEXT NOT NULL,
    "hostJoinUrl" TEXT,
    "providerType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "idempotencyKey" TEXT NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "rawMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationEvent" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT,
    "externalMeetingId" TEXT,
    "eventType" TEXT NOT NULL,
    "providerType" TEXT,
    "source" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT,
    "payload" JSONB,
    "correlationId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "externalEventId" TEXT,
    "eventType" TEXT NOT NULL,
    "rawPayload" BYTEA,
    "signatureValid" BOOLEAN NOT NULL DEFAULT false,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "appointmentId" TEXT,
    "processingError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT,
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "messageContent" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationPreference" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "preferredChannel" TEXT NOT NULL DEFAULT 'PORTAL',
    "fallbackChannels" JSONB NOT NULL DEFAULT '[]',
    "allowWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "allowEmail" BOOLEAN NOT NULL DEFAULT true,
    "allowSms" BOOLEAN NOT NULL DEFAULT false,
    "allowPush" BOOLEAN NOT NULL DEFAULT true,
    "reminderIntervals" JSONB NOT NULL DEFAULT '["24h", "2h"]',
    "accessibilityNeeds" JSONB,
    "consentRecordedAt" TIMESTAMP(3),
    "consentVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderHealthStatus" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "latencyMs" INTEGER,
    "errorRate" DOUBLE PRECISION,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOnlineAt" TIMESTAMP(3),
    "incidentId" TEXT,

    CONSTRAINT "ProviderHealthStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationTemplate" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "name" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'pt_BR',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mcsiMaxLevel" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "scope" TEXT NOT NULL DEFAULT 'TENANT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystemRole" BOOLEAN NOT NULL DEFAULT true,
    "scope" TEXT NOT NULL DEFAULT 'TENANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDelegation" (
    "id" TEXT NOT NULL,
    "delegatorId" TEXT NOT NULL,
    "delegateeId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'TENANT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpersonationSession" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "ImpersonationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataConsent" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "consentVersion" TEXT NOT NULL,
    "purposes" JSONB NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "guardianId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "collectionChannel" TEXT NOT NULL DEFAULT 'WEB',
    "expiresAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "withdrawalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DataConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "consentId" TEXT,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "requestedBy" TEXT,
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "evidenceLog" JSONB,
    "exportUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataProcessingLog" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "operation" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "purpose" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'SYSTEM',
    "isAutomated" BOOLEAN NOT NULL DEFAULT false,
    "dataFields" JSONB,
    "ipAddress" TEXT,
    "correlationId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataProcessingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymizationRecord" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "technique" TEXT NOT NULL,
    "fieldsProcessed" JSONB NOT NULL,
    "requestId" TEXT,
    "performedBy" TEXT,
    "verifiedBy" TEXT,
    "legalBasis" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionUntil" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "AnonymizationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflineSyncBatch" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "totalItems" INTEGER NOT NULL,
    "syncedItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "clientTime" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfflineSyncBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflineSyncLog" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "serverId" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfflineSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialProgram" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fullDescription" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Outro',
    "status" TEXT NOT NULL DEFAULT 'planejamento',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "targetAudience" TEXT,
    "objectives" JSONB,
    "fundingSources" JSONB,
    "results" TEXT,
    "coordinator" TEXT NOT NULL DEFAULT '',
    "team" JSONB NOT NULL DEFAULT '[]',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "bannerUrl" TEXT,
    "startDate" TEXT NOT NULL DEFAULT '',
    "endDate" TEXT NOT NULL DEFAULT '',
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "raised" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetBeneficiaries" INTEGER NOT NULL DEFAULT 0,
    "activeBeneficiaries" INTEGER NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "centroCusto" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SocialProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreakGlassSession" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "professionalName" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "beneficiaryName" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "emergencyType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "auditLogId" TEXT,
    "notificationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BreakGlassSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Beneficiary_documentCpf_key" ON "Beneficiary"("documentCpf");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_userId_key" ON "Professional"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_cpf_key" ON "Professional"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_email_key" ON "Professional"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CostCenter_code_key" ON "CostCenter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Donor_document_key" ON "Donor"("document");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_code_key" ON "Agreement"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProtectedProfile_beneficiaryId_key" ON "ProtectedProfile"("beneficiaryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProtectedProfile_internalCode_key" ON "ProtectedProfile"("internalCode");

-- CreateIndex
CREATE UNIQUE INDEX "SecureVault_protectedProfileId_key" ON "SecureVault"("protectedProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLogSignature_logId_key" ON "AuditLogSignature"("logId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentChannel_appointmentId_key" ON "AppointmentChannel"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalMeeting_appointmentChannelId_key" ON "ExternalMeeting"("appointmentChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalMeeting_idempotencyKey_key" ON "ExternalMeeting"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLog_idempotencyKey_key" ON "NotificationLog"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationPreference_entityId_entityType_key" ON "CommunicationPreference"("entityId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ImpersonationSession_token_key" ON "ImpersonationSession"("token");

-- CreateIndex
CREATE INDEX "DataConsent_entityId_entityType_idx" ON "DataConsent"("entityId", "entityType");

-- CreateIndex
CREATE INDEX "DataConsent_tenantId_isActive_idx" ON "DataConsent"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_entityId_status_idx" ON "DataSubjectRequest"("entityId", "status");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_tenantId_requestType_status_idx" ON "DataSubjectRequest"("tenantId", "requestType", "status");

-- CreateIndex
CREATE INDEX "DataProcessingLog_entityId_timestamp_idx" ON "DataProcessingLog"("entityId", "timestamp");

-- CreateIndex
CREATE INDEX "DataProcessingLog_tenantId_operation_timestamp_idx" ON "DataProcessingLog"("tenantId", "operation", "timestamp");

-- CreateIndex
CREATE INDEX "OfflineSyncBatch_agentId_status_idx" ON "OfflineSyncBatch"("agentId", "status");

-- CreateIndex
CREATE INDEX "OfflineSyncBatch_deviceId_createdAt_idx" ON "OfflineSyncBatch"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "SocialProgram_status_isPublic_idx" ON "SocialProgram"("status", "isPublic");

-- CreateIndex
CREATE INDEX "SocialProgram_createdAt_idx" ON "SocialProgram"("createdAt");

-- CreateIndex
CREATE INDEX "BreakGlassSession_beneficiaryId_status_idx" ON "BreakGlassSession"("beneficiaryId", "status");

-- CreateIndex
CREATE INDEX "BreakGlassSession_professionalId_requestedAt_idx" ON "BreakGlassSession"("professionalId", "requestedAt");

-- CreateIndex
CREATE INDEX "BreakGlassSession_status_expiresAt_idx" ON "BreakGlassSession"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "BreakGlassSession_tenantId_requestedAt_idx" ON "BreakGlassSession"("tenantId", "requestedAt");

-- AddForeignKey
ALTER TABLE "ProfessionalDocument" ADD CONSTRAINT "ProfessionalDocument_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalProject" ADD CONSTRAINT "ProfessionalProject_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalProject" ADD CONSTRAINT "ProfessionalProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageQueue" ADD CONSTRAINT "TriageQueue_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageQueue" ADD CONSTRAINT "TriageQueue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_reopenedById_fkey" FOREIGN KEY ("reopenedById") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseProfessional" ADD CONSTRAINT "CaseProfessional_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseProfessional" ADD CONSTRAINT "CaseProfessional_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_resourceRoomId_fkey" FOREIGN KEY ("resourceRoomId") REFERENCES "ResourceRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistQueue" ADD CONSTRAINT "WaitlistQueue_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anamnesis" ADD CONSTRAINT "Anamnesis_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anamnesis" ADD CONSTRAINT "Anamnesis_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anamnesis" ADD CONSTRAINT "Anamnesis_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionErrata" ADD CONSTRAINT "EvolutionErrata_evolutionId_fkey" FOREIGN KEY ("evolutionId") REFERENCES "ClinicalEvolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionErrata" ADD CONSTRAINT "EvolutionErrata_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalDocument" ADD CONSTRAINT "ClinicalDocument_evolutionId_fkey" FOREIGN KEY ("evolutionId") REFERENCES "ClinicalEvolution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAttachment" ADD CONSTRAINT "ClinicalAttachment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAttachment" ADD CONSTRAINT "ClinicalAttachment_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAttachment" ADD CONSTRAINT "ClinicalAttachment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessLog" ADD CONSTRAINT "DocumentAccessLog_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ClinicalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessLog" ADD CONSTRAINT "DocumentAccessLog_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttachmentAccessLog" ADD CONSTRAINT "AttachmentAccessLog_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "ClinicalAttachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttachmentAccessLog" ADD CONSTRAINT "AttachmentAccessLog_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalScale" ADD CONSTRAINT "ClinicalScale_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalScale" ADD CONSTRAINT "ClinicalScale_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalScale" ADD CONSTRAINT "ClinicalScale_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndividualCarePlan" ADD CONSTRAINT "IndividualCarePlan_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndividualCarePlan" ADD CONSTRAINT "IndividualCarePlan_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PicGoal" ADD CONSTRAINT "PicGoal_picId_fkey" FOREIGN KEY ("picId") REFERENCES "IndividualCarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PicGoal" ADD CONSTRAINT "PicGoal_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PicVersion" ADD CONSTRAINT "PicVersion_picId_fkey" FOREIGN KEY ("picId") REFERENCES "IndividualCarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PicVersion" ADD CONSTRAINT "PicVersion_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseMeeting" ADD CONSTRAINT "CaseMeeting_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseMeetingParticipant" ADD CONSTRAINT "CaseMeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "CaseMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseMeetingParticipant" ADD CONSTRAINT "CaseMeetingParticipant_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAlert" ADD CONSTRAINT "CaseAlert_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialCategory" ADD CONSTRAINT "FinancialCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FinancialCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinancialCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionCostCenter" ADD CONSTRAINT "TransactionCostCenter_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionCostCenter" ADD CONSTRAINT "TransactionCostCenter_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementObligation" ADD CONSTRAINT "AgreementObligation_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialReconciliation" ADD CONSTRAINT "FinancialReconciliation_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtectedProfile" ADD CONSTRAINT "ProtectedProfile_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecureVault" ADD CONSTRAINT "SecureVault_protectedProfileId_fkey" FOREIGN KEY ("protectedProfileId") REFERENCES "ProtectedProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildGuardian" ADD CONSTRAINT "ChildGuardian_protectedProfileId_fkey" FOREIGN KEY ("protectedProfileId") REFERENCES "ProtectedProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtectedMeasure" ADD CONSTRAINT "ProtectedMeasure_protectedProfileId_fkey" FOREIGN KEY ("protectedProfileId") REFERENCES "ProtectedProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_protectedProfileId_fkey" FOREIGN KEY ("protectedProfileId") REFERENCES "ProtectedProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_authorizedById_fkey" FOREIGN KEY ("authorizedById") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessSession" ADD CONSTRAINT "AccessSession_protectedProfileId_fkey" FOREIGN KEY ("protectedProfileId") REFERENCES "ProtectedProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessSession" ADD CONSTRAINT "AccessSession_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviorAlert" ADD CONSTRAINT "BehaviorAlert_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationAccount" ADD CONSTRAINT "CommunicationAccount_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "CommunicationProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentChannel" ADD CONSTRAINT "AppointmentChannel_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentChannel" ADD CONSTRAINT "AppointmentChannel_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "CommunicationProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentChannel" ADD CONSTRAINT "AppointmentChannel_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CommunicationAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalMeeting" ADD CONSTRAINT "ExternalMeeting_appointmentChannelId_fkey" FOREIGN KEY ("appointmentChannelId") REFERENCES "AppointmentChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderHealthStatus" ADD CONSTRAINT "ProviderHealthStatus_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "CommunicationProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDelegation" ADD CONSTRAINT "UserDelegation_delegatorId_fkey" FOREIGN KEY ("delegatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDelegation" ADD CONSTRAINT "UserDelegation_delegateeId_fkey" FOREIGN KEY ("delegateeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDelegation" ADD CONSTRAINT "UserDelegation_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationSession" ADD CONSTRAINT "ImpersonationSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationSession" ADD CONSTRAINT "ImpersonationSession_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES "DataConsent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfflineSyncLog" ADD CONSTRAINT "OfflineSyncLog_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "OfflineSyncBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
