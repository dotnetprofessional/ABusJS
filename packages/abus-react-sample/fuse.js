const { src, task, context, bumpVersion } = require("fuse-box/sparky");
const { FuseBox, QuantumPlugin, CSSPlugin, SassPlugin, WebIndexPlugin, JSONPlugin } = require("fuse-box");

task("default", async context => {
	await context.clean();
	await context.development();
});

task("dist", async context => {
	await context.clean();
	await context.dist();
});

context(
	class {
		getConfig() {
			return FuseBox.init({
				homeDir: "src",
				target: "browser@es6",
				hash: this.isProduction,
				output: "dist/$name.js",
				useTypescriptCompiler: true,
				sourceMaps: { project: true, vendor: true },
				plugins: [
					JSONPlugin(),
					CSSPlugin(),
					[SassPlugin({ importer: true }), CSSPlugin()],
					WebIndexPlugin({
						template: "src/index.html"
					}),
					this.isProduction &&
					QuantumPlugin({
						css: true,
						uglify: true
					})
				]
			});
		}
		async clean() {
			await src("./dist")
				.clean("dist/")
				.exec();
		}

		async prepareDistFolder() {
			await bumpVersion("package.json", { type: "patch" });
			await src("./package.json")
				.dest("dist/")
				.exec();
		}

		dist() {
			this.isProduction = true;
			const fuse = this.getConfig();
			fuse.dev({ fallback: "index.html" });
			fuse
				.bundle("demo")
				.splitConfig({
					dest: "/chunks/"
				})
				.instructions(">app.tsx");
			return fuse.run();
		}

		development() {
			const fuse = this.getConfig();
			fuse.dev({ fallback: "index.html" });
			fuse
				.bundle("demo")
				.hmr()
				.instructions(">app.tsx")
				.watch();
			return fuse.run();
		}
	}
);
