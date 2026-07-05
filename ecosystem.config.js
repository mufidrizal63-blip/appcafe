module.exports = {
  apps: [
    {
      name: "appcafe",
      script: "./node_modules/next/dist/bin/next",
      interpreter: "node",
      args: "start",
      cwd: "d:/my-app/appcafe",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
