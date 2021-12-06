const axios = require('axios');
const date = require('date-and-time');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs')
const cron = require('node-cron');

const token = '5087288388:AAHYf5WNdZbtDfq2LBB3u1S9Z4-_selBllw';
const bot = new TelegramBot(token, {polling: true});

const categories = ['front-end', 'backend', 'cli', 'documentation', 'css', 'testing', 'iot', 'coverage', 'mobile', 'framework', 'robotics', 'math'];
const Channelid = '-1001699650376';

const phrases = [
    'А вот и новый пакет!',
    'Какая неожиданность, ведь вышел новый пакет!',
    '9 утра как раз то время что-бы рассказать тебе о новом пакете!',
    'Если ты искал годный пакет то тебе сюда!',
    ''
]

const later = new Date();
const start = new Date();
const end = new Date();

start.setDate(start.getDate() - 7);
later.setDate(later.getDate() - 14);

const laterDate = date.format(later, 'YYYY-MM-DD');
const endDate = date.format(end, 'YYYY-MM-DD'); // date now
const startDate = date.format(start, 'YYYY-MM-DD'); // week ago

async function get() {
    const results = [];

    for (const item of categories) {
        const { data } = await axios.get(`https://api.npms.io/v2/search/?q=keywords:${item}+popularity-weight:100`);
        results.push(data.results);
    }
    return results;
}
console.log('[INFO] Bot was stated...')
cron.schedule('*/5 * * * *', () => {
    (async () => {
        const content = await get();

        const result = await Promise.all(
            content.map(async (item) => Promise.all(item.map(async (obj) => {
                const { data } = await axios.get(`https://api.npmjs.org/downloads/point/${startDate}:${endDate}/${obj.package.name}`);

                return {
                    name: obj.package.name,
                    link: obj.package.links.npm,
                    descr: obj.package.description,
                    date: obj.package.date,
                    downloads: data.downloads,
                };
            }))),
        );
        let finalresult = result.flat().sort((a,b) =>
            new Date(b.date) - new Date(a.date));
        let i = Math.floor(Math.random() * finalresult.length)
        async function output() {
            console.log('[INFO] Trying to output...')
            if(JSON.parse(fs.readFileSync('blacklist.json', 'utf8')).indexOf(finalresult[i].name) >= 0) {
                i = Math.floor(Math.random() * finalresult.length)
                output()
            }else{
                const { data } = await axios.get(`https://api.npmjs.org/downloads/point/${laterDate}:${startDate}/${finalresult[i].name}`);
                const percent = Math.floor((finalresult[i].downloads * 100 / data.downloads))
                console.log('[INFO] Percent value is ' + percent)
                console.log('[INFO] I-Count value is ' + i)
                console.log('[INFO] Downloads value is ' + finalresult[i].downloads)
                console.log('[INFO] Downloads value later is ' + data.downloads)
                console.log('[INFO] Name of package is ' + finalresult[i].name)
                if(percent >= 70 && finalresult[i].downloads >= 1000 && finalresult[i].downloads < 2500000) {
                    console.log('[INFO] Output successful, with package - ' + finalresult[i].name)
                    bot.sendMessage(Channelid, `${finalresult[i].name}\n${finalresult[i].descr}\n${finalresult[i].downloads}\n${finalresult[i].link}\n${finalresult[i].date}`)
                    let temp = JSON.parse(fs.readFileSync('blacklist.json', 'utf8'))
                    temp.push(finalresult[i].name)
                    fs.writeFileSync('blacklist.json', JSON.stringify(temp))
                }else{
                    i = Math.floor(Math.random() * finalresult.length)
                    output()
                }
            }
        }
        output()
    })();
});