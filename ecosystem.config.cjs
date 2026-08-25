module.exports = {
  apps: [
    {
      name: "wazeko-bot",
      script: "./dist/examples/enterprise-bot.js",
      instances: 1, // WhatsApp WebSocket connections must be single active socket per credentials
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
