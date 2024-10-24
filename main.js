import axios from 'axios'
import { conHtml } from './utils'

let data = []
let xmlSpots = []
var krpano = null

const obtenerLotes = async() => {
  const response = await axios.get('https://rodan.com.py/propiedades/fraccion/412/lotes')
  return response.data
}

const obtenerSpotsXml = async() => {
  const response = await fetch('krpano/spots.xml')
  const data = await response.text()
  return data
}

try {
  const xmlData = await obtenerSpotsXml()
  const lotes = await obtenerLotes()
  data = lotes
  const parser = new DOMParser()
  const xml = parser.parseFromString(xmlData, "application/xml")
  const spots = xml.getElementsByTagName('spot')    
  
  for( const spot of spots){
    const ath = spot.attributes.ath.textContent
    const atv = spot.attributes.atv.textContent
    const html = spot.attributes.html.textContent
    const escena = spot.attributes.escena.textContent
    const newSpot = { ath, atv, html, escena }
    xmlSpots.push(newSpot)
  }
  
} catch (error) {
    console.log(`ocurrio un error ${error}`)
}

const arr = conHtml(data)

const arrFinal = arr.map(item => {
  const obj = xmlSpots.find( el => el.html === item.html)
  const newObj = { ...obj, ...item }
  return newObj
})
console.log(arrFinal)

function krpano_onready_interface(krpano_interface){
  krpano = krpano_interface 
  if(krpano){
    loadScene('scene_master')
    krpano.events.addListener('onnewscene',renderSpotsPorEscena)
    krpano.display.customFullscreenElement = document.getElementById('pano')
  }
}
function renderSpotsPorEscena(){
  const scene = krpano.get('xml.scene')
  loadSpots(scene)
}
function loadScene(nameScene){
  krpano.call(`loadscene(${nameScene}, null, MERGE);`)
}

const loadSpots = (scene) => {

  arrFinal.forEach( item => {
    if(scene === item.escena){
      const nameFicha = `spot_${item.html}`
      krpano.call(`addhotspot(${nameFicha})`)
      krpano.set(`hotspot[${nameFicha}].ath`,item.ath)
      krpano.set(`hotspot[${nameFicha}].atv`,item.atv)
      krpano.set(`hotspot[${nameFicha}].html`,item.codigo.trim())
      if(item.tipo === '1'){
        if(item.idgi_loteestado === '1' || item.idgi_loteestado === '3'){
          krpano.call(`hotspot[${nameFicha}].loadstyle(hs_pro_disponible)`)
          krpano.set(`hotspot[${nameFicha}].onclick`, () => mostrarFicha(item))
        }else if(item.idgi_loteestado !== null){
          krpano.call(`hotspot[${nameFicha}].loadstyle(hs_pro_nodisponible)`)
        }   
      }    
    }
    
  }) 
}

const mostrarFicha = (item) => {

  const { html, cuotas_cnt, importecuota, superficie_m2, preciovtacontado, codigo, codigo_manzana } = item

  const importecuotaPY = new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(importecuota)
  const preciovtacontadoPY = new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(preciovtacontado)
  const superficie = new Intl.NumberFormat("de-DE").format(superficie_m2)
  const id = `${codigo_manzana.trim()}-${codigo.trim()}`
  const cuotas = parseInt(cuotas_cnt) + 1 
  const card = document.createElement('div')
  const pano = document.getElementById('pano')
  const filter = document.createElement('div')
  filter.classList.add('position-absolute','w-100','h-100','top-0','start-0')

  card.innerHTML = `
    <div style="position:absolute; left: 10px; top:calc(50vh - 200px); z-index: 20; ">
      <div class="card" style="width: 18rem; background-color:rgba(0,0,0,0.75);">
        <div class="card-body">
          <h5 class="card-title text-white">${id}</h5>
          <p class="text-white">Estado: Disponible</p>
          <p class="text-white">Superficie: ${superficie} M2</p>
          <p class="text-white">Valor Cuota ${cuotas} Meses: ${importecuotaPY}</p>
          <p class="text-white">Precio Contado: ${preciovtacontadoPY}</p>
          <div class="btn-group d-flex justify-content-evenly" role="group">
            
          </div>
        </div>
      </div>
    </div>
  `
  const buttonContinuar = document.createElement('button')
  const buttonPlano = document.createElement('button')

  buttonPlano.classList.add('btn', 'btn-outline-success')
  buttonPlano.textContent = 'Plano'

  buttonContinuar.classList.add('btn', 'btn-success')
  buttonContinuar.textContent = 'Continuar'

  buttonContinuar.addEventListener('click', () => {
    card.remove()
    filter.remove()
  })
  buttonPlano.addEventListener('click', () => window.open('./assets/plano.pdf','_blank'))
  
  pano.appendChild(card)
  pano.appendChild(filter)
  const buttonGroup = document.querySelector('.btn-group')
  buttonGroup.appendChild(buttonPlano)
  buttonGroup.appendChild(buttonContinuar)
}

embedpano({ 
  xml:'./krpano/tour.xml', 
  target:'pano', 
  html5:"only",
  basePath:"%VIEWER%",
  bgcolor:"#FFFFFF",
  mwheel:false,
  onready: krpano_onready_interface
})


