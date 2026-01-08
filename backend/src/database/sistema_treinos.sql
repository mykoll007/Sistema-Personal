-- Criar schema
CREATE DATABASE IF NOT EXISTS sistema_treinos
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

-- Selecionar schema
USE sistema_treinos;

-- Tabela de personals
CREATE TABLE personals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    foto_url VARCHAR(255) NULL,  -- campo para armazenar o caminho ou URL da foto
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de alunos
CREATE TABLE alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    personal_id INT,
    email VARCHAR(120) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL, 
    nome VARCHAR(100) NOT NULL,
    foco VARCHAR(120) NOT NULL,
    idade INT NOT NULL,
    data_matricula DATE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (personal_id) REFERENCES personals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de categorias
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    personal_id INT,
    nome VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (personal_id) REFERENCES personals(id) ON DELETE CASCADE
);

-- Tabela de exercicios
CREATE TABLE exercicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    personal_id INT,
    categoria_id INT,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT NULL,
    video_url VARCHAR(255) NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (personal_id) REFERENCES personals(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- Tabela aluno_treinos
CREATE TABLE aluno_treinos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    exercicio_id INT NOT NULL,
    series INT NOT NULL,
    repeticoes INT NOT NULL,
    peso INT NOT NULL,
    intervalo_seg INT NOT NULL,
    treino VARCHAR(50) NOT NULL,
    nome_treino VARCHAR(100),
    status ENUM('em_andamento', 'finalizado') DEFAULT 'em_andamento',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finalizado_em DATETIME NULL,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (exercicio_id) REFERENCES exercicios(id) ON DELETE CASCADE
);


-- Tabela de feedbacks (feedback dado pelo aluno)
CREATE TABLE feedbacks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    personal_id INT NOT NULL,
    mensagem TEXT NOT NULL,
    estrelas TINYINT NOT NULL CHECK (estrelas BETWEEN 1 AND 5),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (personal_id) REFERENCES personals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

