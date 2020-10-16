#!/usr/bin/env node
const fsp = require('fs').promises;
const fs = require('fs');
const glob = require("glob");
const program = require('./program')

const filepath = `${program.file}.md`

const options = {
  ignore: '**/node_modules/**'
}

const files = glob.sync("**/**.+(js|jsx|ts|tsx)", options)

const readFile = filename =>
  new Promise((resolve, reject) => {
    fs.readFile(filename, { encoding: 'utf-8' }, (err, data) => {
      if (err) {
        return reject(err)
      }

      const start = data.indexOf('/*sdoc')

      if (start <= -1 || start >= 10) {
        return resolve('')
      }

      const ends = data.indexOf('*/')

      resolve({
        filename,
        data: data.slice(start + 7, ends).trim()
      })
    })
  })

const readFiles = async () => {
  return Promise.all(files.map(item => readFile(item)))
}

const filterFiles = async () => {
  const read = await readFiles()
  const filtered = read.filter(el => el !== '')
  return filtered
}

const formatText = (text, mode) => {
  switch (mode) {
    case 'index':
      const sanitizedText = text.filename.replace(/\/|\./g,'').replace(/ /g,'-')
      return `[${text.filename}](#${sanitizedText})`
    case 'description':
      return `#### ${text.filename}\n  ${text.data}`
  }
}

const parseDescription = async () => {
  const filtered = await filterFiles()
  const textToWrite = filtered.map(el => formatText(el, 'description'))
  return textToWrite.join('\n')
}

const parseIndex = async () => {
  const filtered = await filterFiles()
  const textToWrite = filtered.map(el => formatText(el, 'index'))
  return textToWrite.join('\n') + '\n'
}


(async () => {
  if (program.index){
  await fsp.writeFile(filepath, await parseIndex(), 'utf8')
  await fsp.appendFile(filepath, await parseDescription(), 'utf8')
  } else {
    await fsp.writeFile(filepath, await parseDescription(), 'utf8')
  }
})();