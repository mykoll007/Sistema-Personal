const database = require('../database/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const fs = require("fs");
const path = require("path");




class PersonalController {

    // 📌 Cadastrar personal
    cadastrarPersonal(request, response) {
        const { nome, email, senha, confirmarSenha } = request.body;

        if (senha !== confirmarSenha) {
            return response.status(400).json({ message: "As senhas não coincidem." });
        }

        const senhaSegura = bcrypt.hashSync(senha, 10);

        database('personals')
            .where({ email })
            .first()
            .then(existe => {
                if (existe) {
                    return response.status(400).json({ message: "Email já cadastrado." });
                }

                if (senha.length < 5) {
                    return response.status(400).json({ message: "A senha precisa ter no mínimo 5 caracteres." });
                }

                database('personals')
                    .insert({
                        nome,
                        email,
                        senha: senhaSegura
                    })
                    .then(() => {
                        response.status(201).json({ message: "Personal cadastrado com sucesso!" });
                    })
                    .catch(error => {
                        console.error("Erro ao cadastrar personal:", error);
                        response.status(500).json({ message: "Erro ao criar personal." });
                    });
            })
            .catch(error => {
                console.error("Erro ao verificar personal:", error);
                response.status(500).json({ message: "Erro ao verificar personal existente." });
            });
    }

    // 📌 Autenticar personal
    autenticarPersonal(request, response) {
        const { email, senha } = request.body;

        database('personals')
            .where({ email })
            .first()
            .then(async personal => {

                if (!personal)
                    return response.status(401).json({ message: "Login ou senha incorreta!" });

                const validarSenha = await bcrypt.compare(senha, personal.senha);

                if (!validarSenha)
                    return response.status(401).json({ message: "Login ou senha incorreta!" });

                const token = jwt.sign(
                    { personal_id: personal.id },
                    process.env.SALT,
                    { expiresIn: '1h' }
                );

                response.status(200).json({ cod: 0, token });
            })
            .catch(error => {
                console.error("Erro ao autenticar personal:", error);
                response.status(500).json({ message: "Erro ao tentar autenticar o personal." });
            });
    }

    // Listar personal logado via token
    listarPersonalLogado(request, response) {
        const personalId = request.personalId; // setado pelo middleware de autenticação JWT

        if (!personalId) {
            return response.status(401).json({ message: "Token inválido! Personal não reconhecido." });
        }

        database('personals')
            .where({ id: personalId })
            .first()
            .then(personal => {
                if (!personal) {
                    return response.status(404).json({ message: "Personal não encontrado" });
                }

                return response.status(200).json({ personal });
            })
            .catch(error => {
                console.error(error);
                return response.status(500).json({ message: "Erro ao obter personal." });
            });
    }


    // 📌 Listar todos os personals
    listarPersonals(request, response) {
        database('personals')
            .select('*')
            .then(personals => {
                response.status(200).json(personals);
            })
            .catch(error => {
                console.error("Erro ao listar personals:", error);
                response.status(500).json({ message: "Erro ao obter personals." });
            });
    }

    // 📌 Listar um personal pelo ID
    listarUmPersonal(request, response) {
        const { id } = request.params;

        database('personals')
            .where({ id })
            .first()
            .then(personal => {
                if (!personal) {
                    return response.status(404).json({ message: "Personal não encontrado" });
                }

                response.status(200).json({ personal });
            })
            .catch(error => {
                console.error("Erro ao buscar personal:", error);
                response.status(500).json({ message: "Erro ao obter personal." });
            });
    }

    // 📌 Atualizar personal
    atualizarPersonal(request, response) {
        const { id } = request.params;
        const { nome, email, foto_url } = request.body;

        const dadosAtualizados = { nome };

        if (foto_url !== undefined) {
            dadosAtualizados.foto_url = foto_url;
        }

        // Só verifica duplicidade se email foi enviado
        if (email) {
            database('personals')
                .where('email', email)
                .andWhereNot('id', id)
                .first()
                .then(emailExistente => {
                    if (emailExistente) {
                        return response.status(400).json({ message: "Este email já está cadastrado!" });
                    }

                    database('personals')
                        .where({ id })
                        .update({ ...dadosAtualizados, email })
                        .then(() => {
                            response.status(200).json({ message: "Perfil atualizado com sucesso!" });
                        })
                        .catch(error => {
                            console.error(error);
                            response.status(500).json({ message: "Erro ao atualizar personal." });
                        });
                })
                .catch(error => {
                    console.error(error);
                    response.status(500).json({ message: "Erro ao verificar dados no banco." });
                });
        } else {
            // Sem email, só atualiza nome e foto
            database('personals')
                .where({ id })
                .update(dadosAtualizados)
                .then(() => {
                    response.status(200).json({ message: "Perfil atualizado com sucesso!" });
                })
                .catch(error => {
                    console.error(error);
                    response.status(500).json({ message: "Erro ao atualizar personal." });
                });
        }
    }

    // 📌 Upload de foto do personal
    async uploadFoto(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "Nenhuma foto enviada." });
            }

            const foto_url = req.file.path; // Cloudinary já retorna a URL completa

            await database('personals')
                .where({ id: req.personalId })
                .update({ foto_url });

            return res.status(200).json({ foto_url });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro ao salvar foto." });
        }
    }



    async uploadVideoExercicio(req, res) {
        try {
            const { id } = req.params;
            const { video_url } = req.body;

            if (!video_url)
                return res.status(400).json({ message: "URL do vídeo é obrigatória" });

            const exercicio = await database("exercicios")
                .where({ id, personal_id: req.personalId })
                .first();

            if (!exercicio)
                return res.status(404).json({ message: "Exercício não encontrado" });

            await database("exercicios")
                .where({ id })
                .update({ video_url });

            return res.status(200).json({ message: "Vídeo atualizado com sucesso!", video_url });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Erro ao atualizar vídeo" });
        }
    }

    // 📌 ADICIONAR ALUNO (com email + senha)
    async adicionarAluno(request, response) {
        const { email, senha, confirmarSenha, nome, foco, idade, data_matricula } = request.body;
        const personalId = request.personalId; // vem do token

        if (!personalId) {
            return response.status(401).json({ message: "Token inválido! Personal não reconhecido." });
        }

        if (senha !== confirmarSenha) {
            return response.status(400).json({ message: "As senhas não coincidem." });
        }

        try {
            // Verifica email já cadastrado
            const existe = await database('alunos').where({ email }).first();
            if (existe) {
                return response.status(400).json({ message: "Email já está cadastrado!" });
            }

            const senhaHash = bcrypt.hashSync(senha, 10);

            await database('alunos').insert({
                personal_id: personalId,
                email,
                senha: senhaHash,
                nome,
                foco,
                idade,
                data_matricula
            });

            return response.status(201).json({ message: "Aluno cadastrado com sucesso!" });

        } catch (error) {
            console.error("Erro ao adicionar aluno:", error);
            return response.status(500).json({ message: "Erro ao cadastrar aluno." });
        }
    }
    // 📌 Listar todos os alunos de um personal
    async listarAlunos(request, response) {
        const personalId = request.personalId;

        if (!personalId) {
            return response.status(401).json({ message: "Token inválido! Personal não reconhecido." });
        }

        try {
            const alunos = await database('alunos')
                .where({ personal_id: personalId })
                .select('id', 'email', 'nome', 'foco', 'idade', 'data_matricula', 'criado_em', 'foto_antes_url', 'foto_depois_url');

            return response.status(200).json(alunos);
        } catch (error) {
            console.error("Erro ao listar alunos:", error);
            return response.status(500).json({ message: "Erro ao buscar alunos." });
        }
    }

async editarAluno(request, response) {
  const { id } = request.params;
  const personalId = request.personalId;
  const { nome, email, foco, idade, data_matricula, foto_antes_url, foto_depois_url } = request.body;

  if (!personalId) {
    return response.status(401).json({ message: "Token inválido! Personal não reconhecido." });
  }

  try {
    const aluno = await database("alunos")
      .where({ id, personal_id: personalId })
      .first();

    if (!aluno) {
      return response.status(403).json({ message: "Este aluno não pertence ao seu perfil." });
    }

    if (email && email !== aluno.email) {
      const emailExistente = await database("alunos")
        .where({ email })
        .andWhereNot("id", id)
        .first();

      if (emailExistente) {
        return response.status(400).json({ message: "Este email já está em uso por outro aluno." });
      }
    }

    const updateData = {
      nome: nome ?? aluno.nome,
      email: email ?? aluno.email,
      foco: foco ?? aluno.foco,
      idade: idade ?? aluno.idade,
      data_matricula: data_matricula ?? aluno.data_matricula
    };

    // ✅ só atualiza se veio no body
    if (foto_antes_url !== undefined) updateData.foto_antes_url = foto_antes_url;
    if (foto_depois_url !== undefined) updateData.foto_depois_url = foto_depois_url;

    await database("alunos")
      .where({ id })
      .update(updateData);

    return response.status(200).json({ message: "Aluno atualizado com sucesso!" });

  } catch (error) {
    console.error("Erro ao editar aluno:", error);
    return response.status(500).json({ message: "Erro ao atualizar aluno." });
  }
}


    // 📌 Excluir aluno
    async excluirAluno(request, response) {
        const { id } = request.params;
        const personalId = request.personalId;

        if (!personalId) {
            return response.status(401).json({ message: "Token inválido! Personal não reconhecido." });
        }

        try {
            // Verificar se o aluno pertence ao personal
            const aluno = await database('alunos')
                .where({ id, personal_id: personalId })
                .first();

            if (!aluno) {
                return response.status(403).json({ message: "Este aluno não pertence ao seu perfil." });
            }

            // Deletar aluno
            await database('alunos')
                .where({ id })
                .del();

            return response.status(200).json({ message: "Aluno excluído com sucesso!" });

        } catch (error) {
            console.error("Erro ao excluir aluno:", error);
            return response.status(500).json({ message: "Erro ao excluir aluno." });
        }
    }


    async criarExercicio(request, response) {
        const { categoria_id, nome, descricao, video_url } = request.body;
        const personal_id = request.personalId; // ✅ CORRETO

        if (!nome || !categoria_id) {
            return response.status(400).json({
                message: "Nome e categoria são obrigatórios."
            });
        }

        try {
            const categoria = await database('categorias')
                .where({ id: categoria_id, personal_id })
                .first();

            if (!categoria) {
                return response.status(403).json({
                    message: "Esta categoria não pertence ao seu perfil."
                });
            }

            await database('exercicios').insert({
                personal_id,
                categoria_id,
                nome,
                descricao,
                video_url
            });

            return response.status(201).json({
                message: "Exercício criado com sucesso!"
            });

        } catch (error) {
            console.error("Erro ao criar exercício:", error);
            return response.status(500).json({
                message: "Erro ao criar exercício."
            });
        }
    }


    async listarExercicios(request, response) {
        try {
            const personal_id = request.personalId; // ✅

            const exercicios = await database('exercicios as e')
                .join('categorias as c', 'e.categoria_id', 'c.id')
                .where('e.personal_id', personal_id)
                .select(
                    'e.id',
                    'e.nome',
                    'e.descricao',
                    'e.video_url',
                    'e.categoria_id',
                    'c.nome as categoria_nome'
                );

            return response.status(200).json(exercicios);

        } catch (error) {
            console.error("ERRO LISTAR EXERCICIOS:", error);
            return response.status(500).json({
                message: "Erro ao listar exercícios"
            });
        }
    }



    async listarExerciciosPorCategoria(request, response) {
        const personal_id = request.personalId; // ✅
        const { categoria_id } = request.params;

        try {
            const exercicios = await database('exercicios')
                .join('categorias', 'exercicios.categoria_id', 'categorias.id')
                .where({
                    'exercicios.personal_id': personal_id,
                    'exercicios.categoria_id': categoria_id
                })
                .select(
                    'exercicios.id',
                    'exercicios.nome',
                    'exercicios.descricao',
                    'exercicios.video_url',
                    'categorias.id as categoria_id',
                    'categorias.nome as categoria_nome'
                );

            return response.status(200).json(exercicios);

        } catch (error) {
            console.error("Erro ao listar por categoria:", error);
            return response.status(500).json({
                message: "Erro ao listar exercícios da categoria."
            });
        }
    }

    async atualizarExercicio(request, response) {
        const { id } = request.params;
        const { categoria_id, nome, descricao } = request.body;
        const personal_id = request.personalId;

        if (!nome || !categoria_id) {
            return response.status(400).json({
                message: "Nome e categoria são obrigatórios."
            });
        }

        try {
            // 🔍 Verifica se exercício pertence ao personal
            const exercicio = await database('exercicios')
                .where({ id, personal_id })
                .first();

            if (!exercicio) {
                return response.status(403).json({
                    message: "Este exercício não pertence ao seu perfil."
                });
            }

            // 🔍 Verifica se categoria pertence ao personal
            const categoria = await database('categorias')
                .where({ id: categoria_id, personal_id })
                .first();

            if (!categoria) {
                return response.status(403).json({
                    message: "Esta categoria não pertence ao seu perfil."
                });
            }

            await database('exercicios')
                .where({ id })
                .update({
                    categoria_id,
                    nome,
                    descricao
                });

            return response.status(200).json({
                message: "Exercício atualizado com sucesso!"
            });

        } catch (error) {
            console.error("Erro ao atualizar exercício:", error);
            return response.status(500).json({
                message: "Erro ao atualizar exercício."
            });
        }
    }


    async deletarExercicio(request, response) {
        const { id } = request.params;
        const personal_id = request.personalId;

        try {
            const exercicio = await database('exercicios')
                .where({ id, personal_id })
                .first();

            if (!exercicio) {
                return response.status(403).json({
                    message: "Você não tem permissão para deletar este exercício."
                });
            }

            // 🧹 REMOVE O VÍDEO DO DISCO
            if (exercicio.video_url) {
                const caminhoVideo = path.join(__dirname, '../../', exercicio.video_url);
                if (fs.existsSync(caminhoVideo)) {
                    fs.unlinkSync(caminhoVideo);
                }
            }

            await database('exercicios')
                .where({ id })
                .del();

            return response.status(200).json({
                message: "Exercício deletado com sucesso!"
            });

        } catch (error) {
            console.error(error);
            return response.status(500).json({
                message: "Erro ao deletar exercício."
            });
        }
    }

    // 📌 Categorias
    async criarCategoria(request, response) {
        const { nome } = request.body;
        const personal_id = request.personalId; // ✅ CORRETO

        if (!nome) {
            return response.status(400).json({
                message: "O nome da categoria é obrigatório."
            });
        }

        try {
            await database('categorias').insert({
                personal_id,
                nome
            });

            return response.status(201).json({
                message: "Categoria criada com sucesso!"
            });

        } catch (error) {
            console.error("Erro ao criar categoria:", error);
            return response.status(500).json({
                message: "Erro ao criar categoria."
            });
        }
    }


    async listarCategorias(request, response) {
        const personal_id = request.personalId; // ✅ CORRETO

        try {
            const categorias = await database('categorias')
                .where({ personal_id })
                .select('id', 'nome'); // 🔥 só o necessário

            return response.status(200).json(categorias);

        } catch (error) {
            console.error("Erro ao listar categorias:", error);
            return response.status(500).json({
                message: "Erro ao listar categorias."
            });
        }
    }


    async atualizarCategoria(request, response) {
        const { id } = request.params;
        const { nome } = request.body;
        const personal_id = request.personalId; // ✅ CORRETO

        if (!nome) {
            return response.status(400).json({
                message: "O nome da categoria é obrigatório."
            });
        }

        try {
            const categoria = await database('categorias')
                .where({ id, personal_id })
                .first();

            if (!categoria) {
                return response.status(403).json({
                    message: "Esta categoria não pertence ao seu perfil."
                });
            }

            await database('categorias')
                .where({ id })
                .update({ nome });

            return response.status(200).json({
                message: "Categoria atualizada com sucesso!"
            });

        } catch (error) {
            console.error("Erro ao atualizar categoria:", error);
            return response.status(500).json({
                message: "Erro ao atualizar categoria."
            });
        }
    }


    async deletarCategoria(request, response) {
        const { id } = request.params;
        const personal_id = request.personalId; // ✅ CORRETO

        try {
            const categoria = await database('categorias')
                .where({ id, personal_id })
                .first();

            if (!categoria) {
                return response.status(403).json({
                    message: "Esta categoria não pertence ao seu perfil."
                });
            }

            await database('categorias')
                .where({ id })
                .del();

            return response.status(200).json({
                message: "Categoria deletada com sucesso!"
            });

        } catch (error) {
            console.error("Erro ao deletar categoria:", error);
            return response.status(500).json({
                message: "Erro ao deletar categoria."
            });
        }
    }


    async adicionarExercicioAoAluno(request, response) {
        const {
            aluno_id,
            exercicio_id,
            series,
            repeticoes,
            peso,
            intervalo_seg,
            treino,
            nome_treino
        } = request.body;


        const personal_id = request.personalId;

        if (
            !aluno_id ||
            !exercicio_id ||
            !series ||
            !repeticoes ||
            !peso ||
            !intervalo_seg ||
            !treino
        ) {
            return response.status(400).json({
                message: "Todos os campos são obrigatórios."
            });
        }

        try {
            // 🔍 Verificar se o aluno pertence ao personal
            const aluno = await database('alunos')
                .where({ id: aluno_id, personal_id })
                .first();

            if (!aluno) {
                return response.status(403).json({
                    message: "Este aluno não pertence ao seu perfil."
                });
            }

            // 🔍 Verificar se o exercício pertence ao personal
            const exercicio = await database('exercicios')
                .where({ id: exercicio_id, personal_id })
                .first();

            if (!exercicio) {
                return response.status(403).json({
                    message: "Este exercício não pertence ao seu perfil."
                });
            }

            // 📌 Inserir treino
            await database('aluno_treinos').insert({
                aluno_id,
                exercicio_id,
                treino,
                nome_treino: nome_treino || null,
                series,
                repeticoes,
                peso,
                intervalo_seg
            });


            return response.status(201).json({
                message: "Exercício adicionado ao treino do aluno com sucesso!"
            });

        } catch (error) {
            console.error("Erro ao adicionar exercício ao aluno:", error);
            return response.status(500).json({
                message: "Erro ao adicionar exercício ao treino."
            });
        }
    }


    // 📌 Listar treinos de um aluno
    async listarTreinosDoAluno(request, response) {
        const { id: aluno_id } = request.params;
        const personal_id = request.personalId;

        if (!aluno_id) {
            return response.status(400).json({ message: "ID do aluno é obrigatório." });
        }

        try {
            // Verifica se o aluno pertence ao personal
            const aluno = await database('alunos')
                .where({ id: aluno_id, personal_id })
                .first();

            if (!aluno) {
                return response.status(403).json({
                    message: "Este aluno não pertence ao seu perfil."
                });
            }

            // Busca treinos vinculados
            const treinos = await database('aluno_treinos as at')
                .join('exercicios as e', 'at.exercicio_id', 'e.id')
                .select(
                    'at.exercicio_id',
                    'at.treino',
                    'at.nome_treino',
                    'at.series',
                    'at.repeticoes',
                    'at.peso',
                    'at.intervalo_seg',
                    'at.descricao',
                    'at.ordem',
                    'e.nome as exercicio_nome',
                    'e.categoria_id'
                )

                .where({ aluno_id })
                .orderBy('at.treino')
                .orderBy('at.ordem');

            return response.status(200).json(treinos);

        } catch (error) {
            console.error("Erro ao listar treinos do aluno:", error);
            return response.status(500).json({
                message: "Erro ao listar treinos do aluno."
            });
        }
    }


    async deletarTreinoDoAluno(req, res) {
        const { aluno_id, exercicio_id, treino } = req.params;
        const personal_id = req.personalId;

        if (!treino) {
            return res.status(400).json({ message: "Treino é obrigatório." });
        }

        try {
            const registro = await database('aluno_treinos as at')
                .join('alunos as a', 'at.aluno_id', 'a.id')
                .where({
                    'at.aluno_id': aluno_id,
                    'at.exercicio_id': exercicio_id,
                    'at.treino': treino,
                    'a.personal_id': personal_id
                })
                .first();

            if (!registro) {
                return res.status(403).json({
                    message: "Treino não encontrado ou não pertence ao seu aluno."
                });
            }

            await database('aluno_treinos')
                .where({
                    aluno_id,
                    exercicio_id,
                    treino
                })
                .del();

            return res.status(200).json({
                message: "Treino removido com sucesso!"
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Erro ao remover treino."
            });
        }
    }


async salvarTreinosDoAluno(req, res) {
  const { aluno_id, treinos } = req.body;
  const personal_id = req.personalId;

  if (!aluno_id) {
    return res.status(400).json({ message: "Aluno obrigatório." });
  }

  if (!Array.isArray(treinos)) {
    return res.status(400).json({ message: "Treinos deve ser um array." });
  }

  try {
    // ✅ garante que o aluno pertence ao personal
    const aluno = await database("alunos")
      .where({ id: aluno_id, personal_id })
      .first();

    if (!aluno) {
      return res.status(403).json({ message: "Este aluno não pertence ao seu perfil." });
    }

    // ✅ Normaliza payload:
    // - se vier expandido: [{exercicio_id, treino:"A", ...}]
    // - se vier agrupado: [{exercicio_id, treinos:["A","C"], ...}]
    const normalizados = [];
    for (const t of treinos) {
      const exercicio_id = Number(t.exercicio_id);

      // aceita treino único ou array
      const letras =
        Array.isArray(t.treinos) ? t.treinos :
        (t.treino ? [t.treino] : []);

      for (const letra of letras) {
        if (!letra) continue;

        normalizados.push({
          exercicio_id,
          treino: String(letra).trim().toUpperCase(),
          nome_treino: t.nome_treino ?? null,
          series: Number(t.series) || 0,
          repeticoes: Number(t.repeticoes) || 0,
          peso: Number(t.peso) || 0,
          intervalo_seg: Number(t.intervalo_seg) || 0,
          descricao: t.descricao ?? null,
          ordem: Number(t.ordem) || 0
        });
      }
    }

    // se nada veio, significa: remover tudo do aluno
    // (opcional: você pode bloquear isso, se quiser)
    await database.transaction(async (trx) => {
      // 1) Buscar treinos atuais (por letra)
      const treinosAtuais = await trx("aluno_treinos as at")
        .join("alunos as a", "at.aluno_id", "a.id")
        .where("at.aluno_id", aluno_id)
        .andWhere("a.personal_id", personal_id)
        .select("at.exercicio_id", "at.treino");

      const atuais = treinosAtuais.map((t) => ({
        exercicio_id: Number(t.exercicio_id),
        treino: String(t.treino)
      }));

      const novos = normalizados.map((t) => ({
        exercicio_id: Number(t.exercicio_id),
        treino: String(t.treino)
      }));

      // 2) Deletar o que saiu
      const paraDeletar = atuais.filter((a) =>
        !novos.some((n) => n.exercicio_id === a.exercicio_id && n.treino === a.treino)
      );

      for (const t of paraDeletar) {
        await trx("aluno_treinos")
          .where({
            aluno_id,
            exercicio_id: t.exercicio_id,
            treino: t.treino
          })
          .del();
      }

      // 3) Inserir/Atualizar os novos
      //    - se existir, update
      //    - se não existir, insert
      for (const t of normalizados) {
        const existe = atuais.some((a) =>
          a.exercicio_id === t.exercicio_id && a.treino === t.treino
        );

        if (existe) {
          await trx("aluno_treinos")
            .where({
              aluno_id,
              exercicio_id: t.exercicio_id,
              treino: t.treino
            })
            .update({
              nome_treino: t.nome_treino || null,
              series: t.series,
              repeticoes: t.repeticoes,
              peso: t.peso,
              intervalo_seg: t.intervalo_seg,
              descricao: t.descricao || null,
              ordem: t.ordem
            });
        } else {
          await trx("aluno_treinos")
            .insert({
              aluno_id,
              exercicio_id: t.exercicio_id,
              treino: t.treino,
              nome_treino: t.nome_treino || null,
              series: t.series,
              repeticoes: t.repeticoes,
              peso: t.peso,
              intervalo_seg: t.intervalo_seg,
              descricao: t.descricao || null,
              ordem: t.ordem
            });
        }
      }
    });

    return res.status(200).json({ message: "Treinos salvos com sucesso!" });

  } catch (error) {
    console.error("Erro ao salvar treinos do aluno:", error);
    return res.status(500).json({ message: "Erro ao salvar treinos do aluno." });
  }
}


    
// 📌 Listar feedbacks do personal logado 
async listarFeedbacks(request, response) {
  const personal_id = request.personalId;

  if (!personal_id) {
    return response.status(401).json({ message: "Token inválido! Personal não reconhecido." });
  }

  try {
    const feedbacks = await database('feedbacks as f')
      .join('alunos as a', 'f.aluno_id', 'a.id')

      // pega nome_treino do aluno para aquela letra (A/B/C...)
      .leftJoin('aluno_treinos as at', function () {
        this.on('at.aluno_id', '=', 'f.aluno_id')
            .andOn('at.treino', '=', 'f.treino');
      })

      .where('f.personal_id', personal_id)

      .select(
        'f.id',
        'f.mensagem',
        'f.estrelas',
        'f.treino',
        'f.criado_em',
        'a.id as aluno_id',
        'a.nome as aluno_nome',
        'a.email as aluno_email'
      )

      // como tem várias linhas em aluno_treinos (por exercício),
      // agregamos para 1 nome_treino por feedback
      .max({ nome_treino: 'at.nome_treino' })

      .groupBy(
        'f.id',
        'f.mensagem',
        'f.estrelas',
        'f.treino',
        'f.criado_em',
        'a.id',
        'a.nome',
        'a.email'
      )

      .orderBy('f.criado_em', 'desc');

    return response.status(200).json(feedbacks);
  } catch (error) {
    console.error("Erro ao listar feedbacks:", error);
    return response.status(500).json({ message: "Erro ao buscar feedbacks." });
  }
}



}

module.exports = new PersonalController();
