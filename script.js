// ============================================================
// DONI CELULAR - SISTEMA COMPLETO
// Compatível com GitHub Pages + LocalStorage
// ============================================================

"use strict";

// ------------------------------------------------------------
// BANCO LOCAL
// ------------------------------------------------------------

const carregarBanco = (chave) => {
    try {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : [];
    } catch (erro) {
        console.error("Erro ao carregar banco:", chave, erro);
        return [];
    }
};

const salvarBanco = (chave, dados) => {
    try {
        localStorage.setItem(chave, JSON.stringify(dados));
        return true;
    } catch (erro) {
        console.error("Erro ao salvar:", chave, erro);
        alert(
            "Não foi possível salvar os dados. " +
            "O armazenamento do navegador pode estar cheio."
        );
        return false;
    }
};

// Inicializa os bancos
if (!localStorage.getItem("estoque")) salvarBanco("estoque", []);
if (!localStorage.getItem("os")) salvarBanco("os", []);
if (!localStorage.getItem("vendas")) salvarBanco("vendas", []);

let imagemBase64Global = "";

// ------------------------------------------------------------
// UTILITÁRIOS
// ------------------------------------------------------------

function escaparHTML(valor) {
    if (valor === null || valor === undefined) return "";

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function gerarId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function imagemPadrao() {
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg"
             width="500"
             height="500"
             viewBox="0 0 500 500">
            <rect width="500" height="500" fill="#e2e8f0"/>
            <text x="250"
                  y="250"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  font-family="Arial"
                  font-size="35"
                  fill="#64748b">
                Sem imagem
            </text>
        </svg>
    `);
}

// ------------------------------------------------------------
// INICIALIZAÇÃO
// ------------------------------------------------------------

window.addEventListener("DOMContentLoaded", () => {
    atualizarTelas();
});

// ------------------------------------------------------------
// ATUALIZA TODAS AS TELAS
// ------------------------------------------------------------

function atualizarTelas() {
    renderVitrine();
    renderEstoque();
    renderOS();
    renderHistoricoVendas();
    carregarSelectVendas();
    calcularFinanceiro();
}

// ------------------------------------------------------------
// MENU MOBILE
// ------------------------------------------------------------

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.toggle("open");
    }
}

function switchView(viewId) {
    document.querySelectorAll(".view").forEach(view => {
        view.classList.remove("active");
    });

    document.querySelectorAll("nav button").forEach(button => {
        button.classList.remove("active");
    });

    const targetView = document.getElementById(`view-${viewId}`);
    const targetButton = document.getElementById(`btn-${viewId}`);

    if (targetView) {
        targetView.classList.add("active");
    }

    if (targetButton) {
        targetButton.classList.add("active");
    }

    const sidebar = document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    if (viewId === "vendas") {
        carregarSelectVendas();
    }

    if (viewId === "financeiro") {
        calcularFinanceiro();
    }
}

// ------------------------------------------------------------
// IMAGEM DO PRODUTO
// ------------------------------------------------------------

function visualizarImagemSelecionada(input) {
    if (!input || !input.files || !input.files[0]) {
        imagemBase64Global = "";

        const preview = document.getElementById("img-preview");

        if (preview) {
            preview.src = "";
            preview.style.display = "none";
        }

        return;
    }

    const arquivo = input.files[0];

    if (!arquivo.type.startsWith("image/")) {
        alert("Selecione um arquivo de imagem válido.");
        input.value = "";
        return;
    }

    // Limite inicial para evitar arquivos gigantes
    if (arquivo.size > 10 * 1024 * 1024) {
        alert("A imagem é muito grande. Escolha uma imagem de até 10 MB.");
        input.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function(evento) {
        imagemBase64Global = evento.target.result;

        const preview = document.getElementById("img-preview");

        if (preview) {
            preview.src = imagemBase64Global;
            preview.style.display = "block";
        }
    };

    reader.onerror = function() {
        alert("Não foi possível carregar a imagem.");
        imagemBase64Global = "";
    };

    reader.readAsDataURL(arquivo);
}

// ------------------------------------------------------------
// ESTOQUE
// ------------------------------------------------------------

function adicionarEstoque() {
    const marca = document.getElementById("est-marca").value.trim();
    const modelo = document.getElementById("est-modelo").value.trim();
    const tipo = document.getElementById("est-tipo").value;

    const qtd = Math.max(
        0,
        parseInt(document.getElementById("est-qtd").value) || 0
    );

    const preco = Math.max(
        0,
        parseFloat(document.getElementById("est-preco").value) || 0
    );

    if (!marca || !modelo) {
        alert("Preencha a Marca e o Modelo.");
        return;
    }

    if (preco <= 0) {
        alert("Informe um preço de venda válido.");
        return;
    }

    const foto = imagemBase64Global || imagemPadrao();

    const estoque = carregarBanco("estoque");

    estoque.push({
        id: gerarId(),
        marca,
        modelo,
        tipo,
        qtd,
        preco,
        foto,
        criadoEm: new Date().toISOString()
    });

    if (!salvarBanco("estoque", estoque)) {
        return;
    }

    limparFormularioEstoque();

    alert("Produto salvo no estoque com sucesso!");

    atualizarTelas();
}

function limparFormularioEstoque() {
    const campos = [
        "est-marca",
        "est-modelo",
        "est-preco"
    ];

    campos.forEach(id => {
        const campo = document.getElementById(id);

        if (campo) {
            campo.value = "";
        }
    });

    const quantidade = document.getElementById("est-qtd");

    if (quantidade) {
        quantidade.value = "1";
    }

    const arquivo = document.getElementById("est-foto-file");

    if (arquivo) {
        arquivo.value = "";
    }

    const preview = document.getElementById("img-preview");

    if (preview) {
        preview.src = "";
        preview.style.display = "none";
    }

    imagemBase64Global = "";
}

// ------------------------------------------------------------
// RENDER ESTOQUE
// ------------------------------------------------------------

function renderEstoque(filtro = "") {
    const tbody = document.getElementById("tabela-estoque");

    if (!tbody) return;

    tbody.innerHTML = "";

    const busca = String(filtro).toLowerCase().trim();
    const estoque = carregarBanco("estoque");

    if (estoque.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:30px;">
                    Nenhum produto cadastrado.
                </td>
            </tr>
        `;
        return;
    }

    estoque.forEach(item => {
        const marca = String(item.marca || "");
        const modelo = String(item.modelo || "");
        const tipo = String(item.tipo || "");

        const textoPesquisa =
            `${marca} ${modelo} ${tipo}`.toLowerCase();

        if (busca && !textoPesquisa.includes(busca)) {
            return;
        }

        const foto = item.foto || imagemPadrao();
        const preco = Number(item.preco || 0);
        const qtd = Number(item.qtd || 0);

        tbody.innerHTML += `
            <tr>
                <td>
                    <img
                        src="${escaparHTML(foto)}"
                        alt="Produto"
                        style="
                            width:50px;
                            height:50px;
                            object-fit:cover;
                            border-radius:8px;
                            border:1px solid #e2e8f0;
                        "
                        onerror="this.src=imagemPadrao()"
                    >
                </td>

                <td>
                    <strong>${escaparHTML(marca)}</strong>
                </td>

                <td>
                    ${escaparHTML(tipo)}
                    (${escaparHTML(modelo)})
                </td>

                <td>
                    ${qtd} un
                </td>

                <td>
                    ${formatarMoeda(preco)}
                </td>

                <td>
                    <button
                        onclick="deletarGeral('estoque', ${Number(item.id)})"
                        style="
                            color:var(--danger);
                            border:none;
                            background:none;
                            cursor:pointer;
                            font-weight:bold;
                        "
                    >
                        Excluir
                    </button>
                </td>
            </tr>
        `;
    });
}

function filtrarEstoque() {
    const campo = document.getElementById("busca-estoque");

    renderEstoque(campo ? campo.value : "");
}

// ------------------------------------------------------------
// VITRINE
// ------------------------------------------------------------

function renderVitrine(filtro = "") {
    const container = document.getElementById("vitrine-produtos");

    if (!container) return;

    container.innerHTML = "";

    const busca = String(filtro).toLowerCase().trim();

    const estoque = carregarBanco("estoque");

    let encontrados = 0;

    estoque.forEach(item => {
        const qtd = Number(item.qtd || 0);

        if (qtd <= 0) return;

        const marca = String(item.marca || "");
        const modelo = String(item.modelo || "");
        const tipo = String(item.tipo || "");

        const texto =
            `${marca} ${modelo} ${tipo}`.toLowerCase();

        if (busca && !texto.includes(busca)) {
            return;
        }

        encontrados++;

        const foto = item.foto || imagemPadrao();

        container.innerHTML += `
            <div class="product-card">

                <span class="badge">
                    Disponível: ${qtd}
                </span>

                <img
                    src="${escaparHTML(foto)}"
                    class="product-img"
                    alt="${escaparHTML(modelo)}"
                    onerror="this.src=imagemPadrao()"
                >

                <div class="product-title">
                    ${escaparHTML(tipo)}
                </div>

                <div style="
                    font-size:0.9rem;
                    color:#475569;
                    margin-bottom:10px;
                ">
                    ${escaparHTML(marca)} -
                    ${escaparHTML(modelo)}
                </div>

                <div class="product-price">
                    ${formatarMoeda(item.preco)}
                </div>

            </div>
        `;
    });

    if (encontrados === 0) {
        container.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                background:white;
                padding:40px;
                border-radius:12px;
                color:#64748b;
            ">
                <h3>Nenhum produto encontrado</h3>
                <p style="margin-top:8px;">
                    Tente pesquisar por outra marca, modelo ou acessório.
                </p>
            </div>
        `;
    }
}

function filtrarVitrine() {
    const campo = document.getElementById("busca-publica");

    renderVitrine(campo ? campo.value : "");
}

// ------------------------------------------------------------
// ORDENS DE SERVIÇO
// ------------------------------------------------------------

function salvarOS() {
    const cliente =
        document.getElementById("os-cliente").value.trim();

    const aparelho =
        document.getElementById("os-aparelho").value.trim();

    const defeito =
        document.getElementById("os-defeito").value.trim();

    const status =
        document.getElementById("os-status").value;

    const valor =
        Math.max(
            0,
            parseFloat(
                document.getElementById("os-valor").value
            ) || 0
        );

    const pagamento =
        document.getElementById("os-pagamento").value;

    const garantia =
        document.getElementById("os-garantia").value.trim();

    if (!cliente || !aparelho || !defeito) {
        alert(
            "Preencha cliente, aparelho e defeito relatado."
        );
        return;
    }

    const agora = new Date();

    const vencimento = new Date(
        agora.getTime() +
        90 * 24 * 60 * 60 * 1000
    );

    const lista = carregarBanco("os");

    lista.push({
        id: gerarId(),
        cliente,
        aparelho,
        defeito,
        status,
        valor,
        pagamento,
        garantia,
        entrada: agora.toLocaleDateString("pt-BR"),
        vencimento: vencimento.toLocaleDateString("pt-BR"),
        criadoEm: agora.toISOString()
    });

    if (!salvarBanco("os", lista)) {
        return;
    }

    document.getElementById("os-cliente").value = "";
    document.getElementById("os-aparelho").value = "";
    document.getElementById("os-defeito").value = "";
    document.getElementById("os-valor").value = "0.00";

    alert("Ordem de serviço registrada!");

    atualizarTelas();
}

function renderOS() {
    const tbody = document.getElementById("tabela-os");

    if (!tbody) return;

    tbody.innerHTML = "";

    const lista = carregarBanco("os");

    if (lista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:30px;">
                    Nenhuma ordem de serviço registrada.
                </td>
            </tr>
        `;
        return;
    }

    lista.forEach(os => {
        const status = String(os.status || "");

        let cor = "orange";

        if (status.includes("Concluído")) {
            cor = "var(--success)";
        }

        tbody.innerHTML += `
            <tr>

                <td>
                    #${String(os.id).slice(-4)}
                </td>

                <td>
                    ${escaparHTML(os.cliente)}
                </td>

                <td>
                    ${escaparHTML(os.aparelho)}
                </td>

                <td>
                    <span style="
                        color:${cor};
                        font-weight:700;
                    ">
                        ${escaparHTML(status)}
                    </span>
                </td>

                <td>
                    ${formatarMoeda(os.valor)}
                </td>

                <td>
                    <button
                        onclick="imprimirOS(${Number(os.id)})"
                        class="btn"
                        style="
                            padding:5px 10px;
                            font-size:0.75rem;
                            width:auto;
                            background:var(--dark);
                        "
                    >
                        Imprimir
                    </button>

                    <button
                        onclick="deletarGeral('os', ${Number(os.id)})"
                        style="
                            margin-left:8px;
                            color:var(--danger);
                            border:none;
                            background:none;
                            cursor:pointer;
                            font-weight:bold;
                        "
                    >
                        Excluir
                    </button>
                </td>

            </tr>
        `;
    });
}

// ------------------------------------------------------------
// IMPRESSÃO DA OS
// ------------------------------------------------------------

function imprimirOS(id) {
    const lista = carregarBanco("os");

    const os = lista.find(item => Number(item.id) === Number(id));

    if (!os) {
        alert("Ordem de serviço não encontrada.");
        return;
    }

    const ticket = document.getElementById("ticket-reunido");

    if (!ticket) return;

    ticket.innerHTML = `
        <div style="text-align:center;">
            <h2 style="border:none; padding:0; margin-bottom:5px;">
                DONI CELULAR
            </h2>

            <h3>
                COMPROVANTE DE ASSISTÊNCIA
            </h3>

            <p>
                Nº #${String(os.id).slice(-4)}
            </p>
        </div>

        <p>-----------------------------------</p>

        <p>
            <strong>Entrada:</strong>
            ${escaparHTML(os.entrada)}
        </p>

        <p>
            <strong>Garantia até:</strong>
            ${escaparHTML(os.vencimento)}
        </p>

        <p>-----------------------------------</p>

        <p>
            <strong>Cliente:</strong>
            ${escaparHTML(os.cliente)}
        </p>

        <p>
            <strong>Aparelho:</strong>
            ${escaparHTML(os.aparelho)}
        </p>

        <p>
            <strong>Serviço:</strong>
            ${escaparHTML(os.defeito)}
        </p>

        <p>
            <strong>Status:</strong>
            ${escaparHTML(os.status)}
        </p>

        <p>
            <strong>Pagamento:</strong>
            ${escaparHTML(os.pagamento)}
        </p>

        <p>-----------------------------------</p>

        <p>
            <strong>
                VALOR:
                ${formatarMoeda(os.valor)}
            </strong>
        </p>

        <p style="font-size:10px; margin-top:15px;">
            <strong>Termos de garantia:</strong><br>
            ${escaparHTML(os.garantia)}
        </p>
    `;

    ticket.style.display = "block";

    setTimeout(() => {
        window.print();

        setTimeout(() => {
            ticket.style.display = "none";
        }, 500);
    }, 200);
}

// ------------------------------------------------------------
// CAIXA / VENDAS
// ------------------------------------------------------------

function carregarSelectVendas() {
    const select = document.getElementById("venda-item");

    if (!select) return;

    select.innerHTML =
        `<option value="">Selecione o produto...</option>`;

    const estoque = carregarBanco("estoque");

    estoque.forEach(item => {
        if (Number(item.qtd) <= 0) return;

        const option = document.createElement("option");

        option.value = item.id;
        option.textContent =
            `${item.marca} - ${item.tipo} (${item.modelo})`;

        option.dataset.preco = Number(item.preco || 0);

        select.appendChild(option);
    });

    atualizarPrecoVenda();
}

function atualizarPrecoVenda() {
    const select =
        document.getElementById("venda-item");

    const preco =
        document.getElementById("venda-preco");

    if (!select || !preco) return;

    const option =
        select.options[select.selectedIndex];

    if (
        option &&
        select.value &&
        option.dataset.preco !== undefined
    ) {
        preco.value =
            Number(option.dataset.preco).toFixed(2);
    } else {
        preco.value = "";
    }
}

function registrarVenda() {
    const select =
        document.getElementById("venda-item");

    const id = Number(select.value);

    if (!id) {
        alert("Selecione um produto para vender.");
        return;
    }

    const pagamento =
        document.getElementById("venda-pagamento").value;

    const estoque = carregarBanco("estoque");
    const vendas = carregarBanco("vendas");

    const index =
        estoque.findIndex(item => Number(item.id) === id);

    if (index === -1) {
        alert("Produto não encontrado no estoque.");
        atualizarTelas();
        return;
    }

    if (Number(estoque[index].qtd) <= 0) {
        alert("Este produto está sem estoque.");
        atualizarTelas();
        return;
    }

    const produto = estoque[index];

    const venda = {
        id: gerarId(),
        estoqueId: produto.id,
        item: `${produto.marca} - ${produto.tipo} (${produto.modelo})`,
        marca: produto.marca,
        modelo: produto.modelo,
        tipo: produto.tipo,
        valor: Number(produto.preco || 0),
        pagamento,
        data: new Date().toISOString(),
        horario: new Date().toLocaleString("pt-BR")
    };

    estoque[index].qtd =
        Number(estoque[index].qtd) - 1;

    vendas.push(venda);

    if (!salvarBanco("estoque", estoque)) {
        return;
    }

    if (!salvarBanco("vendas", vendas)) {
        // Tenta desfazer a baixa do estoque
        estoque[index].qtd =
            Number(estoque[index].qtd) + 1;

        salvarBanco("estoque", estoque);

        return;
    }

    select.value = "";

    const preco =
        document.getElementById("venda-preco");

    if (preco) {
        preco.value = "";
    }

    alert(
        `Venda realizada com sucesso!\n\n` +
        `Valor: ${formatarMoeda(venda.valor)}\n` +
        `Pagamento: ${venda.pagamento}`
    );

    atualizarTelas();
}

// ------------------------------------------------------------
// HISTÓRICO DE VENDAS
// ------------------------------------------------------------

function renderHistoricoVendas() {
    const tbody =
        document.getElementById("tabela-vendas");

    if (!tbody) return;

    tbody.innerHTML = "";

    const vendas = carregarBanco("vendas");

    if (vendas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:30px;">
                    Nenhuma venda registrada.
                </td>
            </tr>
        `;
        return;
    }

    [...vendas].reverse().forEach(venda => {
        tbody.innerHTML += `
            <tr>

                <td>
                    ${escaparHTML(venda.horario)}
                </td>

                <td>
                    ${escaparHTML(venda.item)}
                </td>

                <td>
                    ${formatarMoeda(venda.valor)}
                </td>

                <td>
                    ${escaparHTML(venda.pagamento)}
                </td>

                <td>
                    <button
                        onclick="deletarVenda(${Number(venda.id)})"
                        style="
                            color:var(--danger);
                            border:none;
                            background:none;
                            cursor:pointer;
                            font-weight:bold;
                        "
                    >
                        Excluir
                    </button>
                </td>

            </tr>
        `;
    });
}

// ------------------------------------------------------------
// EXCLUIR VENDA
// Devolve 1 unidade ao estoque
// ------------------------------------------------------------

function deletarVenda(id) {
    if (
        !confirm(
            "Deseja excluir esta venda?\n\n" +
            "A quantidade será devolvida ao estoque."
        )
    ) {
        return;
    }

    const vendas = carregarBanco("vendas");

    const venda = vendas.find(
        item => Number(item.id) === Number(id)
    );

    if (!venda) {
        alert("Venda não encontrada.");
        return;
    }

    const novasVendas = vendas.filter(
        item => Number(item.id) !== Number(id)
    );

    const estoque = carregarBanco("estoque");

    const produto = estoque.find(
        item =>
            Number(item.id) === Number(venda.estoqueId)
    );

    if (produto) {
        produto.qtd =
            Number(produto.qtd || 0) + 1;
    }

    salvarBanco("estoque", estoque);
    salvarBanco("vendas", novasVendas);

    atualizarTelas();
}

// ------------------------------------------------------------
// FINANCEIRO
// ------------------------------------------------------------

function calcularFinanceiro() {
    const vendas = carregarBanco("vendas");
    const os = carregarBanco("os");

    let total = 0;
    let pix = 0;
    let dinheiro = 0;
    let cartao = 0;

    vendas.forEach(venda => {
        const valor = Number(venda.valor || 0);

        total += valor;

        if (venda.pagamento === "Pix") {
            pix += valor;
        }

        if (venda.pagamento === "Dinheiro") {
            dinheiro += valor;
        }

        if (venda.pagamento === "Cartão") {
            cartao += valor;
        }
    });

    // OS também entra no faturamento
    os.forEach(ordem => {
        const valor = Number(ordem.valor || 0);

        // Só contabiliza OS concluída/entregue
        if (
            String(ordem.status)
                .toLowerCase()
                .includes("concluído")
        ) {
            total += valor;

            if (ordem.pagamento === "Pix") {
                pix += valor;
            }

            if (ordem.pagamento === "Dinheiro") {
                dinheiro += valor;
            }

            if (ordem.pagamento === "Cartão") {
                cartao += valor;
            }
        }
    });

    const totalEl =
        document.getElementById("fat-total");

    const pixEl =
        document.getElementById("fat-pix");

    const dinheiroEl =
        document.getElementById("fat-dinheiro");

    const cartaoEl =
        document.getElementById("fat-cartao");

    if (totalEl) {
        totalEl.textContent = formatarMoeda(total);
    }

    if (pixEl) {
        pixEl.textContent = formatarMoeda(pix);
    }

    if (dinheiroEl) {
        dinheiroEl.textContent =
            formatarMoeda(dinheiro);
    }

    if (cartaoEl) {
        cartaoEl.textContent =
            formatarMoeda(cartao);
    }
}

// ------------------------------------------------------------
// EXCLUSÃO GERAL
// ------------------------------------------------------------

function deletarGeral(chave, id) {
    let mensagem = "Deseja excluir este registro?";

    if (chave === "estoque") {
        mensagem =
            "Deseja excluir este produto do estoque?";
    }

    if (chave === "os") {
        mensagem =
            "Deseja excluir esta ordem de serviço?";
    }

    if (!confirm(mensagem)) {
        return;
    }

    const dados = carregarBanco(chave);

    const novosDados = dados.filter(
        item => Number(item.id) !== Number(id)
    );

    if (novosDados.length === dados.length) {
        alert("Registro não encontrado.");
        return;
    }

    salvarBanco(chave, novosDados);

    atualizarTelas();
}

// ------------------------------------------------------------
// EXPORTAR DADOS
// ------------------------------------------------------------

function exportarBackup() {
    const backup = {
        estoque: carregarBanco("estoque"),
        os: carregarBanco("os"),
        vendas: carregarBanco("vendas"),
        data: new Date().toISOString()
    };

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
        `backup-doni-celular-${new Date()
            .toISOString()
            .slice(0, 10)}.json`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}

// ------------------------------------------------------------
// IMPORTAR BACKUP
// ------------------------------------------------------------

function importarBackup(input) {
    if (!input.files || !input.files[0]) {
        return;
    }

    const arquivo = input.files[0];

    const reader = new FileReader();

    reader.onload = function(evento) {
        try {
            const backup =
                JSON.parse(evento.target.result);

            if (!backup.estoque ||
                !backup.os ||
                !backup.vendas) {

                throw new Error(
                    "Arquivo de backup inválido."
                );
            }

            if (
                !confirm(
                    "Importar este backup substituirá " +
                    "os dados atuais. Continuar?"
                )
            ) {
                input.value = "";
                return;
            }

            salvarBanco("estoque", backup.estoque);
            salvarBanco("os", backup.os);
            salvarBanco("vendas", backup.vendas);

            atualizarTelas();

            alert(
                "Backup importado com sucesso!"
            );

        } catch (erro) {
            console.error(erro);

            alert(
                "Não foi possível importar o backup."
            );
        }

        input.value = "";
    };

    reader.readAsText(arquivo);
}

// ------------------------------------------------------------
// DISPONIBILIZA FUNÇÕES PARA O HTML
// ------------------------------------------------------------

window.toggleSidebar = toggleSidebar;
window.switchView = switchView;

window.visualizarImagemSelecionada =
    visualizarImagemSelecionada;

window.adicionarEstoque =
    adicionarEstoque;

window.filtrarEstoque =
    filtrarEstoque;

window.filtrarVitrine =
    filtrarVitrine;

window.salvarOS =
    salvarOS;

window.imprimirOS =
    imprimirOS;

window.carregarSelectVendas =
    carregarSelectVendas;

window.atualizarPrecoVenda =
    atualizarPrecoVenda;

window.registrarVenda =
    registrarVenda;

window.deletarVenda =
    deletarVenda;

window.deletarGeral =
    deletarGeral;

window.exportarBackup =
    exportarBackup;

window.importarBackup =
    importarBackup;
