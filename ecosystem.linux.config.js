module.exports = {
  apps: [{
    name: 'webDashboardAsset',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3002',
    cwd: '/var/empty/iassetsdb',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
