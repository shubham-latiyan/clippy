const { clipboard, remote } = require('electron');
const dexie = require('dexie')
dexie.debug = true;
const db = new dexie("history");
const input = document.querySelector('input');
const table = document.querySelector('table');

remote.getCurrentWindow().on('show', function () {
    input.focus();
});

document.body.addEventListener('keydown', function (e) {
    let focusable = Array.from(document.querySelectorAll("tr td:first-child"));
    let index = focusable.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
        let nextElement = focusable[index + 1] || focusable[0];
        nextElement.focus();
    } else if (e.key === 'ArrowUp') {
        let nextElement = focusable[index - 1] || focusable[focusable.length - 1];
        nextElement.focus();
    } else if (e.key === 'Enter') {
        changeToSelected(e)
    } else if (e.key === 'Escape') {
        input.value = '';
        refreshView();
        remote.getCurrentWindow().close();
    } else {
        input.focus();
        refreshView();
    }
});

table.addEventListener('click', changeToSelected);

async function changeToSelected(e) {
    console.log('e.target.id:', e.target.id)
    console.log('e.target.tagName:', e.target.tagName)
    if (e.target.id) {
        // if (clipboard.readText() === (await db.history.get(parseInt(e.target.id))).text) {
        //     return;
        // }
        if (e.target.tagName === 'TD') {
            clipboard.writeText((await db.history.get(parseInt(e.target.id))).text);
        } 
        else if (e.target.id && e.target.tagName === 'BUTTON') {
            await db.history.delete(parseInt(e.target.id));
        }
        refreshView();
    }
}

function refreshView() {
    db.history.count((r) => {
        document.querySelector('title').innerText = `Clippy (${r})`;
        input.placeholder = `Search in ${r} clips`;
    });
    return db.history.limit(100).desc()
        .filter((history) => {
            return !input.value || history.text.toLowerCase().indexOf(input.value.toLowerCase()) !== -1;
        })
        .toArray()
        .then((history) => {
            table.innerHTML = '';
            let tabindex = 0;
            const tbody = document.createElement('tbody');
            history.forEach((row) => {
                const tr = document.createElement('tr');
                tabindex++
                tr.innerHTML = `<td tabindex="${tabindex}" id="${row.id}"> </td>
                                <td>
                                    <button type="button" id="${row.id}" class="btn btn-outline-info btn-circle">&#10006;
                                    </button>
                                </td>`;
                tr.querySelector('td').innerText = row.text.replace(/\n/g, ' ');
                tbody.appendChild(tr);
            });
            table.appendChild(tbody)
        });
}

setTimeout(async () => {
    await db.version(1).stores({ history: "++id,text" });
    refreshView();
    let previousText = clipboard.readText();
    setInterval(async () => {
        if (previousText && (previousText !== clipboard.readText())) {
            previousText = clipboard.readText();
            db.history.limit(1000).desc()
                .filter((history) => {
                    return history.text === previousText;
                })
                .toArray()
                .then((history) => {
                    history.forEach((row) => {
                        console.log(row.id);
                        db.history.delete(row.id);
                    });
                });
            db.history.add({ text: previousText }).then(refreshView);
        }
    }, 1000)
});
