const esbuild = require('esbuild');
const fs = require('fs');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Primeiro, faça o build usando ESBuild
esbuild.build({
  entryPoints: ['src/app.js'], // Arquivo de entrada
  outfile: 'dist/app.js',      // Arquivo de saída
  bundle: true,                // Empacotamento
  minify: true,                // Minificação
  sourcemap: false,            // Desabilitar sourcemap
  platform: 'node'             // Especifica que o build é para Node.js
}).then(() => {
  console.log('Build completo. Agora ofuscando o código...');
  
  // Ler o arquivo de saída
  const code = fs.readFileSync('dist/app.js', 'utf8');

  // Ofuscar o código
  const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    deadCodeInjection: true,
    debugProtection: false,
    disableConsoleOutput: true,
    selfDefending: true,
    stringArray: true,
    stringArrayThreshold: 0.75,
    stringArrayEncoding: [], // Não usar codificação
  }).getObfuscatedCode();

  // Escrever o código ofuscado de volta no arquivo
  fs.writeFileSync('dist/app.js', obfuscatedCode);

  console.log('Código ofuscado salvo em dist/app.js');
}).catch((error) => {
  console.error('Erro durante o build:', error);
});
