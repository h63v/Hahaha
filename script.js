const MANGA_FOLDER = "manga";

const worksContainer = document.getElementById("works");
const emptyMessage = document.getElementById("empty");
const countElement = document.getElementById("count");
const searchInput = document.getElementById("search");

const statusNames = {
    ongoing: "مستمر",
    completed: "مكتمل",
    paused: "متوقف"
};

let works = [];
let currentStatus = "all";
let currentSearch = "";


/* =========================================
   معرفة GitHub Owner + Repository تلقائياً
   ========================================= */

function getGitHubInfo() {

    const host = window.location.hostname;
    const path = window.location.pathname;

    /*
      مثال:

      username.github.io
      ↓
      owner = username

      username.github.io/MangaX/
      ↓
      repo = MangaX
    */

    if (!host.endsWith(".github.io")) {
        console.error(
            "MangaX: الموقع ليس مستضافاً على GitHub Pages."
        );
        return null;
    }

    const owner = host.split(".")[0];

    const parts = path
        .split("/")
        .filter(Boolean);

    const repo = parts.length > 0
        ? parts[0]
        : `${owner}.github.io`;

    return {
        owner,
        repo
    };
}


/* =========================================
   جلب محتويات مجلد من GitHub
   ========================================= */

async function getGitHubContents(path) {

    const github = getGitHubInfo();

    if (!github) {
        throw new Error("لم يتم التعرف على GitHub repository");
    }

    const url =
        `https://api.github.com/repos/${github.owner}/${github.repo}/contents/${path}`;

    const response = await fetch(url, {
        headers: {
            "Accept": "application/vnd.github+json"
        }
    });

    if (!response.ok) {
        throw new Error(
            `GitHub API Error: ${response.status}`
        );
    }

    return await response.json();
}


/* =========================================
   قراءة Meta من صفحة العمل
   ========================================= */

function getMeta(html, name) {

    const regex = new RegExp(
        `<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`,
        "i"
    );

    const match = html.match(regex);

    return match ? match[1] : "";
}


/* =========================================
   استخراج عنوان العمل
   ========================================= */

function getTitle(html, fallback) {

    const metaTitle = getMeta(html, "title");

    if (metaTitle) {
        return metaTitle;
    }

    const titleMatch =
        html.match(/<title[^>]*>(.*?)<\/title>/i);

    if (titleMatch) {
        return titleMatch[1]
            .replace(/\s*[-|—].*$/, "")
            .trim();
    }

    return fallback;
}


/* =========================================
   قراءة بيانات العمل
   ========================================= */

async function loadWork(folder) {

    const folderName = folder.name;

    const files =
        await getGitHubContents(
            `${MANGA_FOLDER}/${folderName}`
        );

    /*
      نبحث عن ملف العمل الأساسي

      مثال:

      solo-leveling.html

      وليس:

      solo-leveling-chapter-1.html
    */

    const workFile = files.find(file =>
        file.type === "file" &&
        file.name.endsWith(".html") &&
        !/-chapter-\d+\.html$/i.test(file.name)
    );

    if (!workFile) {
        console.warn(
            `لم يتم العثور على ملف العمل داخل ${folderName}`
        );

        return null;
    }


    /* جلب HTML الخاص بالعمل */

    const response =
        await fetch(workFile.download_url);

    const html =
        await response.text();


    /* استخراج المعلومات */

    const title =
        getTitle(html, folderName);

    const cover =
        getMeta(html, "cover");

    const description =
        getMeta(html, "description");

    const status =
        getMeta(html, "status") || "ongoing";

    const genres =
        getMeta(html, "genres")
            .split(",")
            .map(x => x.trim())
            .filter(Boolean);


    /* =====================================
       جلب الفصول
       ===================================== */

    const chapters = files
        .filter(file =>
            file.type === "file" &&
            new RegExp(
                `^${escapeRegex(
                    workFile.name.replace(".html", "")
                )}-chapter-\\d+\\.html$`,
                "i"
            ).test(file.name)
        )
        .map(file => {

            const match =
                file.name.match(
                    /-chapter-(\d+)\.html$/i
                );

            return {
                number: match
                    ? Number(match[1])
                    : 0,

                name: file.name,

                url:
                    `${MANGA_FOLDER}/${encodeURIComponent(folderName)}/${file.name}`
            };

        })
        .sort((a, b) =>
            b.number - a.number
        );


    return {

        title,
        folder: folderName,

        file:
            `${MANGA_FOLDER}/${encodeURIComponent(folderName)}/${workFile.name}`,

        cover,
        description,
        genres,
        status,
        chapters

    };
}


/* =========================================
   حماية Regex
   ========================================= */

function escapeRegex(string) {

    return string.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

}


/* =========================================
   تحميل جميع الأعمال
   ========================================= */

async function loadAllWorks() {

    try {

        worksContainer.innerHTML = `
            <div class="empty">
                جاري تحميل الأعمال...
            </div>
        `;

        const folders =
            await getGitHubContents(
                MANGA_FOLDER
            );


        const workFolders =
            folders.filter(item =>
                item.type === "dir"
            );


        const results =
            await Promise.all(
                workFolders.map(folder =>
                    loadWork(folder)
                )
            );


        works =
            results.filter(Boolean);


        render();

    } catch (error) {

        console.error(error);

        worksContainer.innerHTML = `
            <div class="empty">
                <h3>حدث خطأ أثناء تحميل الأعمال</h3>
                <p style="margin-top:10px">
                    تأكد من وجود مجلد manga وأن المستودع Public.
                </p>
            </div>
        `;

    }

}


/* =========================================
   حماية النصوص
   ========================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);

}


/* =========================================
   عرض الأعمال
   ========================================= */

function render() {

    const search =
        currentSearch.toLowerCase();


    const filtered =
        works.filter(work => {

            const matchesStatus =
                currentStatus === "all" ||
                work.status === currentStatus;


            const searchable =
                [
                    work.title,
                    work.description,
                    ...work.genres
                ]
                .join(" ")
                .toLowerCase();


            return (
                matchesStatus &&
                searchable.includes(search)
            );

        });


    countElement.textContent =
        `${filtered.length} عمل`;


    worksContainer.innerHTML = "";


    if (filtered.length === 0) {

        emptyMessage.hidden = false;

        return;

    }


    emptyMessage.hidden = true;


    filtered.forEach(work => {

        const card =
            document.createElement("article");

        card.className = "work";


        const genres =
            work.genres
                .map(genre =>
                    `<span class="genre">
                        ${escapeHTML(genre)}
                    </span>`
                )
                .join("");


        card.innerHTML = `

            <div class="cover">

                <img
                    src="${escapeHTML(work.cover)}"
                    alt="${escapeHTML(work.title)}"
                    loading="lazy"
                >

                <span class="status ${escapeHTML(work.status)}">
                    ${escapeHTML(
                        statusNames[work.status] ||
                        work.status
                    )}
                </span>

            </div>


            <div class="work-info">

                <h3>
                    ${escapeHTML(work.title)}
                </h3>


                <p class="description">
                    ${escapeHTML(work.description)}
                </p>


                <div class="genres">
                    ${genres}
                </div>


                <a
                    class="read"
                    href="${escapeHTML(work.file)}"
                >
                    عرض العمل
                </a>

            </div>

        `;


        worksContainer.appendChild(card);

    });

}


/* =========================================
   البحث
   ========================================= */

searchInput.addEventListener(
    "input",
    event => {

        currentSearch =
            event.target.value.trim();

        render();

    }
);


/* =========================================
   الفلاتر
   ========================================= */

document
    .querySelectorAll(".filter")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".filter")
                    .forEach(btn =>
                        btn.classList.remove("active")
                    );


                button.classList.add("active");


                currentStatus =
                    button.dataset.status;


                render();

            }
        );

    });


/* =========================================
   تشغيل النظام
   ========================================= */

loadAllWorks();
