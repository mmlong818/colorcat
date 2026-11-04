const voltar = document.getElementById('voltar');
const avancar = document.getElementById('avancar');
const body = document.querySelector('body');
const bodyAfter = window.getComputedStyle(body, ':after');
const opacity = bodyAfter['opacity'];


const ano = document.querySelector('.ano');
const cor = document.querySelector('.cor');
const hexadecimal = document.querySelector('.hexadecimal');
const pantone = document.querySelector('.pantone');
let index = 0;

const coresAno = [
    {
        'ano': 2022,
        'cor': 'Very Peri',
        'hexadecimal': '#6868AC',
        'pantone' : '17-3938',
    },
    {
        'ano': 2021,
        'cor': 'Illuminating / Ultimate Gray',
        'hexadecimal': '#f5df4d / #939597',
        'pantone' : '13-0647 / 17-5104',
    },
    {
        'ano': 2020,
        'cor': 'Classic Blue',
        'hexadecimal': '#0f4c81',
        'pantone' : '19-4052',
    },
    {
        'ano': 2019,
        'cor': 'Living Coral',
        'hexadecimal': '#ff6f61',
        'pantone' : '16-1546',
    },
    {
        'ano': 2018,
        'cor': 'Ultra Violet',
        'hexadecimal': '#5F4B8B',
        'pantone' : '18-3838',
    },
    {
        'ano': 2017,
        'cor': 'Greenery',
        'hexadecimal': '#88B04B',
        'pantone' : '15-0343',
    },
    {
        'ano': 2016,
        'cor': 'Rose Quartz/Serenity',
        'hexadecimal': '#F7CAC9 / #91A8D0',
        'pantone' : '13-1520 / #15-3919',
    },
    {
        'ano': 2015,
        'cor': 'Marsala',
        'hexadecimal': '#964F4C',
        'pantone' : '18-1438',
    },
    {
        'ano': 2014,
        'cor': 'Orquídia Radiante',
        'hexadecimal': '#AD5E99',
        'pantone' : '18-3224',
    },
    {
        'ano': 2013,
        'cor': 'Verde Esmeralda',
        'hexadecimal': '#009473',
        'pantone' : '17-5641',
    },
    {
        'ano': 2012,
        'cor': 'Tangerine Tango',
        'hexadecimal': '#DD4124',
        'pantone' : '17-1463',
    },
    {
        'ano': 2011,
        'cor': 'Honeysuckle',
        'hexadecimal': '#D94F70',
        'pantone' : '18-2120',
    },
    {
        'ano': 2010,
        'cor': 'Turquoise',
        'hexadecimal': '#45B5AA',
        'pantone' : '15-5519',
    },
    {
        'ano': 2009,
        'cor': 'Mimosa',
        'hexadecimal': '#F0C05A',
        'pantone' : '14-0848',
    },
    {
        'ano': 2008,
        'cor': 'Blue Iris',
        'hexadecimal': '#5A5B9F',
        'pantone' : '18-3943',
    },
    {
        'ano': 2007,
        'cor': 'Chili Pepper',
        'hexadecimal': '#9B1B30',
        'pantone' : '19-1557',
    },
    {
        'ano': 2006,
        'cor': 'Sand Dollar',
        'hexadecimal': '#DECDBE',
        'pantone' : '13-1106',
    },
    {
        'ano': 2005,
        'cor': 'Blue Turquoise',
        'hexadecimal': '#53B0AE',
        'pantone' : '15-5217',
    },
    {
        'ano': 2004,
        'cor': 'Tigerlily',
        'hexadecimal': '#E2583E',
        'pantone' : '17-1456',
    },
    {
        'ano': 2003,
        'cor': 'Aqua Sky',
        'hexadecimal': '#7BC4C4',
        'pantone' : '14-4811',
    },
    {
        'ano': 2002,
        'cor': 'True Red',
        'hexadecimal': '#BF1932',
        'pantone' : '19-1664',
    },
    {
        'ano': 2001,
        'cor': 'Fuchsia Rose',
        'hexadecimal': '#C74375',
        'pantone' : '17-2031',
    },
    {
        'ano': 2000,
        'cor': 'Cerulean',
        'hexadecimal': '#98B2D1',
        'pantone' : '15-4020',
    },
]


document.addEventListener('keydown', function(e){
    if(e.code == 'ArrowLeft'){
        if(index != coresAno.length-1){
            voltarAno()
        }
    } else if(e.code == 'ArrowRight'){
        if(index != 0){
            avancarAno()
        }
}});


function voltarAno(){
    index++;
    if(index != 0){
        avancar.style.visibility = 'visible';
    }
    
    if(index == coresAno.length-1){
        voltar.style.visibility = 'hidden';
    }
    mudarEstilo();
    
}

function avancarAno(){
    index--;
    mudarEstilo();

    index == 0 ? avancar.style.visibility = 'hidden' : avancar.style.visibility = 'visible';
    
    if(index != coresAno.length-1){
        voltar.style.visibility = 'visible';
    }
    
}

function mudarEstilo(){
    if(index == 1){
        body.style.setProperty("--opacity", "1");
    } else if(index == 6){
        body.style.setProperty("--opacity2", "1");     
    } else{
        body.style.setProperty("--opacity", "0");
        body.style.setProperty("--opacity2", "0");
        body.style.background = coresAno[index].hexadecimal;
    }
    hexadecimal.innerHTML = coresAno[index].hexadecimal;
    ano.innerHTML = coresAno[index].ano;
    cor.innerHTML = coresAno[index].cor;
    pantone.innerHTML = coresAno[index].pantone;
}

voltar.addEventListener('click', voltarAno);
avancar.addEventListener('click', avancarAno);