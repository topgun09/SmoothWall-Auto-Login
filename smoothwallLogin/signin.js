const u = document.getElementById('username');
const p = document.getElementById('password');
const s = document.getElementById('submit');

s.addEventListener('click', signin)

document.addEventListener('keydown', e=>{
    if(e.key !== 'Enter') return;
    signedIn();
});


function signin(){
    const usr = u.value,
        pwd = p.value;
    if(usr.length < 1 ) return;
    if(pwd.length < 1 ) return;
    chrome.runtime.sendMessage({event:'signin',usr,pwd});
}