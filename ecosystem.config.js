mmodule.exports = {
  apps: [{
    name: 'my-service',   /* Nombre de la aplicación */
    script: './NodeJS/functions/index.js',   /* Script principal que se ejecutarará */
    cwd:'C:/Users/NYV89/Documents/',                /* Directorio desde el que se lanzará tu aplicación. */
    exec_mode: 'cluster',
    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    //args: 'one two',
    instances: 1,         /* Número de instancia de aplicación que se lanzará */
    autorestart: true,    /* Reinicio automático */
    max_restarts: 2,      /* Número de reinicios inestables consecutivos*/
    watch: true,         /* Ver y reiniciar, si un archivo cambia en la carpeta o subcarpeta, */
    max_memory_restart: '1G',  /* Se reiniciará si excede la cantidad de memoria especificada */
    restart_delay: 5000, /* Tiempo de espera antes de reiniciar una aplicación bloqueada (en milisegundos) */
    post_update: ["npm install","echo Aplicando cambios"],   /* Lista de comandos que se ejecutarán después de realizar una operación de extracción / actualización */
    force: true,         /* Si es verdadero, puede iniciar el mismo script varias veces */
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],

/*   deploy: {
    production: {
      user: 'node',
      host: '212.83.163.1',
      ref: 'origin/master',
      repo: 'git@github.com:repo.git',
      path: '/var/www/production',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  } */
};
