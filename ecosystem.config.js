module.exports = {
  apps: [{
    name: 'webDashboardAsset',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3002',
    cwd: 'c:/Users/LOQ/Documents/IAssetSMBR/iassetsdb',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    instances: 1,
    exec_mode: 'fork'
  }]
};
