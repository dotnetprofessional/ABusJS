import * as React from "react";
import * as ReactDOM from "react-dom";
import { Link, Switch } from "fuse-react";
import "./style.scss";

const config = {
	routes: {
		"/blog": {
			component: () => import("./routes/blog/Blog")
		},
		"/news": {
			component: () => import("./routes/news/News")
		},
		"/listing": {
			component: () => import("./routes/listing/Listing")
		}
		,
		"/todos": {
			component: () => import("./routes/todos/index")
		}
		,
		"/shopping-cart": {
			component: () => import("./routes/shopping-cart/index")
		}
		,
		"/real-world": {
			component: () => import("./routes/real-world/index")
		}
	}
};
class Menu extends React.Component {
	public render() {
		const menuConfig = [
			{ to: "/blog", label: "Blogs" },
			{ to: "/news", label: "News" },
			{ to: "/listing", label: "Listing" },
			{ to: "/todos", label: "TODOs" },
			{ to: "/shopping-cart", label: "Shopping Cart" },
			{ to: "/real-world", label: "Read World" }
		];
		return (
			<div className="menu">
				{menuConfig.map((item, i) => (
					<Link activeClassName="active" key={i} to={item.to}>
						{item.label}
					</Link>
				))}
			</div>
		);
	}
}
class MyRootComponent extends React.Component {
	public render() {
		return (
			<div className="demo">
				<div className="left">
					<Menu />
				</div>
				<div className="right">
					<Switch config={config} />
				</div>
			</div>
		);
	}
}

ReactDOM.render(<MyRootComponent />, document.querySelector("#root"));
