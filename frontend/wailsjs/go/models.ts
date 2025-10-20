export namespace main {
	
	export class BankData {
	    sum: number;
	    sum_currency: number;
	    date: string;
	    cashID: string;
	    cash_register_name: string;
	    Company: string;
	    companyID: string;
	    currency: string;
	    currencyID: string;
	    USD_rate: number;
	    EUR_rate: number;
	    sumUSD: number;
	    sumEUR: number;
	
	    static createFrom(source: any = {}) {
	        return new BankData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sum = source["sum"];
	        this.sum_currency = source["sum_currency"];
	        this.date = source["date"];
	        this.cashID = source["cashID"];
	        this.cash_register_name = source["cash_register_name"];
	        this.Company = source["Company"];
	        this.companyID = source["companyID"];
	        this.currency = source["currency"];
	        this.currencyID = source["currencyID"];
	        this.USD_rate = source["USD_rate"];
	        this.EUR_rate = source["EUR_rate"];
	        this.sumUSD = source["sumUSD"];
	        this.sumEUR = source["sumEUR"];
	    }
	}
	export class CashData {
	    sum: number;
	    sum_currency: number;
	    date: string;
	    cash_register_name: string;
	    currency: string;
	    USD_rate: number;
	    EUR_rate: number;
	    sumUSD: number;
	    sumEUR: number;
	
	    static createFrom(source: any = {}) {
	        return new CashData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sum = source["sum"];
	        this.sum_currency = source["sum_currency"];
	        this.date = source["date"];
	        this.cash_register_name = source["cash_register_name"];
	        this.currency = source["currency"];
	        this.USD_rate = source["USD_rate"];
	        this.EUR_rate = source["EUR_rate"];
	        this.sumUSD = source["sumUSD"];
	        this.sumEUR = source["sumEUR"];
	    }
	}

}

