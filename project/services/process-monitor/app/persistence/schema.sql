-- Schema do serviço process-monitor
-- NÃO substitui tabelas Prisma do app web
-- Usa prefixo monitoring_

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tribunais conhecidos
CREATE TABLE IF NOT EXISTS monitoring_tribunal (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo      text UNIQUE NOT NULL,
    nome        text NOT NULL,
    sistema     text,
    url_base    text,
    ativo       boolean DEFAULT true,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

-- Processos monitorados
CREATE TABLE IF NOT EXISTS monitoring_process (
    id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    jgg_processo_id       text,
    numero_cnj            text UNIQUE NOT NULL,
    numero_cnj_digits     text NOT NULL,
    status_monitoramento  text DEFAULT 'desconhecido',
    tribunal_preferencial text,
    cliente_jgg_id        text,
    metadata              jsonb DEFAULT '{}',
    created_at            timestamptz DEFAULT now(),
    updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_process_cnj ON monitoring_process(numero_cnj);
CREATE INDEX IF NOT EXISTS idx_monitoring_process_cnj_digits ON monitoring_process(numero_cnj_digits);
CREATE INDEX IF NOT EXISTS idx_monitoring_process_status ON monitoring_process(status_monitoramento);

-- Fontes de sincronização por processo
CREATE TABLE IF NOT EXISTS monitoring_process_source (
    id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    monitoring_process_id uuid NOT NULL REFERENCES monitoring_process(id) ON DELETE CASCADE,
    tribunal              text NOT NULL,
    sistema               text,
    processo_id_tribunal  text,
    status_sync           text DEFAULT 'sem_fonte',
    last_sync_at          timestamptz,
    last_error_code       text,
    last_error_message    text,
    raw_meta              jsonb DEFAULT '{}',
    created_at            timestamptz DEFAULT now(),
    updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mps_process_id ON monitoring_process_source(monitoring_process_id);
CREATE INDEX IF NOT EXISTS idx_mps_tribunal ON monitoring_process_source(tribunal);
CREATE INDEX IF NOT EXISTS idx_mps_last_sync ON monitoring_process_source(last_sync_at);

-- Partes (pessoas envolvidas)
CREATE TABLE IF NOT EXISTS monitoring_party (
    id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome       text NOT NULL,
    documento  text,
    tipo       text,
    metadata   jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Vínculo partes-processos
CREATE TABLE IF NOT EXISTS monitoring_process_party (
    id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    monitoring_process_id uuid NOT NULL REFERENCES monitoring_process(id) ON DELETE CASCADE,
    party_id              uuid NOT NULL REFERENCES monitoring_party(id) ON DELETE CASCADE,
    polo                  text NOT NULL,
    created_at            timestamptz DEFAULT now(),
    UNIQUE(monitoring_process_id, party_id, polo)
);

-- Movimentações
CREATE TABLE IF NOT EXISTS monitoring_movement (
    id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    monitoring_process_id uuid NOT NULL REFERENCES monitoring_process(id) ON DELETE CASCADE,
    source_id             uuid REFERENCES monitoring_process_source(id) ON DELETE SET NULL,
    external_id           text,
    data_movimento        timestamptz,
    descricao_original    text NOT NULL,
    tipo_evento           text,
    status_processo       text,
    orgao_julgador        text,
    hash                  text UNIQUE NOT NULL,
    raw                   jsonb DEFAULT '{}',
    created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mm_process_id ON monitoring_movement(monitoring_process_id);
CREATE INDEX IF NOT EXISTS idx_mm_hash ON monitoring_movement(hash);
CREATE INDEX IF NOT EXISTS idx_mm_data ON monitoring_movement(data_movimento);

-- Documentos
CREATE TABLE IF NOT EXISTS monitoring_document (
    id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    monitoring_process_id uuid NOT NULL REFERENCES monitoring_process(id) ON DELETE CASCADE,
    source_id             uuid REFERENCES monitoring_process_source(id) ON DELETE SET NULL,
    external_id           text,
    nome                  text NOT NULL,
    tipo_documento        text,
    mime_type             text,
    storage_key           text,
    hash                  text,
    data_documento        timestamptz,
    raw                   jsonb DEFAULT '{}',
    created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_md_process_id ON monitoring_document(monitoring_process_id);
CREATE INDEX IF NOT EXISTS idx_md_hash ON monitoring_document(hash);

-- Execuções de captura
CREATE TABLE IF NOT EXISTS monitoring_capture_run (
    id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    monitoring_process_id uuid REFERENCES monitoring_process(id) ON DELETE SET NULL,
    tribunal          text NOT NULL,
    connector         text NOT NULL,
    operation         text NOT NULL,
    status            text NOT NULL,
    started_at        timestamptz DEFAULT now(),
    finished_at       timestamptz,
    duration_ms       integer,
    error_code        text,
    error_message     text,
    stats             jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_mcr_process_id ON monitoring_capture_run(monitoring_process_id);
CREATE INDEX IF NOT EXISTS idx_mcr_tribunal ON monitoring_capture_run(tribunal);
CREATE INDEX IF NOT EXISTS idx_mcr_status ON monitoring_capture_run(status);

-- Snapshots brutos
CREATE TABLE IF NOT EXISTS monitoring_raw_snapshot (
    id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    monitoring_process_id uuid REFERENCES monitoring_process(id) ON DELETE SET NULL,
    capture_run_id        uuid REFERENCES monitoring_capture_run(id) ON DELETE SET NULL,
    source                text NOT NULL,
    payload               jsonb NOT NULL,
    hash                  text UNIQUE NOT NULL,
    received_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mrs_process_id ON monitoring_raw_snapshot(monitoring_process_id);
CREATE INDEX IF NOT EXISTS idx_mrs_hash ON monitoring_raw_snapshot(hash);

-- Health dos conectores
CREATE TABLE IF NOT EXISTS monitoring_connector_health (
    id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tribunal          text NOT NULL,
    connector         text NOT NULL,
    status            text NOT NULL,
    last_success_at   timestamptz,
    last_error_at     timestamptz,
    last_error_code   text,
    last_error_message text,
    details           jsonb DEFAULT '{}',
    created_at        timestamptz DEFAULT now(),
    updated_at        timestamptz DEFAULT now(),
    UNIQUE(tribunal, connector)
);

CREATE INDEX IF NOT EXISTS idx_mch_tribunal ON monitoring_connector_health(tribunal);
CREATE INDEX IF NOT EXISTS idx_mch_status ON monitoring_connector_health(status);
