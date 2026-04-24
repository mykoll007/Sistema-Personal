-- =====================================================
-- CRIAR BANCO
-- =====================================================
CREATE DATABASE IF NOT EXISTS sistema_treinos
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE sistema_treinos;

-- =====================================================
-- PERSONALS
-- =====================================================
CREATE TABLE personals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  foto_url VARCHAR(255) NULL,

  creditos_disponiveis INT NOT NULL DEFAULT 100,

  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- ALUNOS
-- =====================================================
CREATE TABLE alunos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  personal_id INT NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  foco VARCHAR(120) NOT NULL,
  idade INT NOT NULL,
  altura DECIMAL(4,2) NOT NULL,
  peso DECIMAL(5,2) NOT NULL,
  data_matricula DATE NOT NULL,
  data_vencimento DATE NULL,

  foto_antes_url VARCHAR(255) NULL,
  foto_depois_url VARCHAR(255) NULL,

  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_aluno_personal
    FOREIGN KEY (personal_id) REFERENCES personals(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- ALUNO_PAGAMENTOS
-- =====================================================
CREATE TABLE aluno_pagamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id INT NOT NULL,
  referencia_mes CHAR(7) NOT NULL,
  valor DECIMAL(10,2) NOT NULL DEFAULT 59.99,
  status ENUM('pendente', 'pago') NOT NULL DEFAULT 'pago',
  pago_em DATETIME NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_pagamento_aluno
    FOREIGN KEY (aluno_id) REFERENCES alunos(id)
    ON DELETE CASCADE,

  CONSTRAINT uniq_aluno_mes
    UNIQUE (aluno_id, referencia_mes)
) ENGINE=InnoDB;

-- =====================================================
-- CRÉDITOS CONSUMIDOS
-- =====================================================
CREATE TABLE personal_creditos_consumidos (
  id INT AUTO_INCREMENT PRIMARY KEY,

  personal_id INT NOT NULL,
  aluno_id INT NULL,

  aluno_nome VARCHAR(100) NOT NULL,

  tipo ENUM('cadastro_aluno', 'renovacao_pagamento') NOT NULL,

  creditos_usados INT NOT NULL DEFAULT 1,

  estornavel_ate DATETIME NULL,
  estornado TINYINT(1) NOT NULL DEFAULT 0,

  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_credito_personal
    FOREIGN KEY (personal_id) REFERENCES personals(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_credito_aluno
    FOREIGN KEY (aluno_id) REFERENCES alunos(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- CATEGORIAS
-- =====================================================
CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  personal_id INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_categoria_personal
    FOREIGN KEY (personal_id) REFERENCES personals(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- EXERCICIOS
-- =====================================================
CREATE TABLE exercicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  personal_id INT NOT NULL,
  categoria_id INT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  descricao TEXT NULL,
  video_url VARCHAR(255) NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_exercicio_personal
    FOREIGN KEY (personal_id) REFERENCES personals(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_exercicio_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- ALUNO_TREINOS
-- =====================================================
CREATE TABLE aluno_treinos (
  id INT AUTO_INCREMENT PRIMARY KEY,

  aluno_id INT NOT NULL,
  exercicio_id INT NOT NULL,

  treino VARCHAR(50) NULL,
  nome_treino VARCHAR(100) NULL,

  series INT NOT NULL DEFAULT 0,
  repeticoes INT NOT NULL DEFAULT 0,
  peso INT NOT NULL DEFAULT 0,
  intervalo_seg INT NOT NULL DEFAULT 0,

  descricao TEXT NULL,
  ordem INT DEFAULT 0,

  status ENUM('em_andamento', 'finalizado')
    DEFAULT 'em_andamento',

  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finalizado_em DATETIME NULL,

  CONSTRAINT fk_aluno_treinos_aluno
    FOREIGN KEY (aluno_id) REFERENCES alunos(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_aluno_treinos_exercicio
    FOREIGN KEY (exercicio_id) REFERENCES exercicios(id)
    ON DELETE CASCADE,

  CONSTRAINT uniq_aluno_exercicio_treino
    UNIQUE (aluno_id, exercicio_id, treino)
) ENGINE=InnoDB;

-- =====================================================
-- FEEDBACKS
-- =====================================================
CREATE TABLE feedbacks (
  id INT AUTO_INCREMENT PRIMARY KEY,

  aluno_id INT NOT NULL,
  personal_id INT NOT NULL,

  treino CHAR(1) NOT NULL,
  mensagem TEXT NULL,
  estrelas TINYINT NOT NULL CHECK (estrelas BETWEEN 1 AND 5),

  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_feedback_aluno
    FOREIGN KEY (aluno_id) REFERENCES alunos(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_feedback_personal
    FOREIGN KEY (personal_id) REFERENCES personals(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;