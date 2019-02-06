export interface IProduct {
    productId: string;
    description: string;
    price: number;
    image: string;
}

export interface IOrder {
    i
}

export interface ILineItem {
    quantity: number;
    product: IProduct
}

export interface IShoppingCart {
    items: ILineItem[];

}

// shopping cart process
export class AddProductCommand {
    constructor(public quantity: number, public product: IProduct) { }
}

export class RemoveProductCommand extends AddProductCommand { }

export class CheckoutCommand { }

// checkout process
export class


