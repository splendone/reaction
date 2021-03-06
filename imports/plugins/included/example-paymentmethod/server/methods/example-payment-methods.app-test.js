import { Meteor } from "meteor/meteor";
import { expect } from "meteor/practicalmeteor:chai";
import { sinon } from "meteor/practicalmeteor:sinon";

import { ExampleApi } from "./exampleapi";

let paymentMethod = {
  processor: "Generic",
  storedCard: "Visa 4242",
  status: "captured",
  mode: "authorize",
  createdAt: new Date()
};


describe("ExampleApi", function () {
  let sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("should return data from ThirdPartyAPI authorize", function () {
    let cardData = {
      name: "Test User",
      number: "4242424242424242",
      expireMonth: "2",
      expireYear: "2018",
      cvv2: "123",
      type: "visa"
    };
    let paymentData = {
      currency: "USD",
      total: "19.99"
    };

    let transactionType = "authorize";
    let transaction = ExampleApi.methods.authorize.call({
      transactionType: transactionType,
      cardData: cardData,
      paymentData: paymentData
    });
    expect(transaction).to.not.be.undefined;
  });

  it("should return data from ThirdPartAPI capture", function (done) {
    let authorizationId = "abc123";
    let amount = 19.99;
    let results = ExampleApi.methods.capture.call({
      authorizationId: authorizationId,
      amount: amount
    });
    expect(results).to.not.be.undefined;
    done();
  });
});


describe("Submit payment", function () {
  let sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("should call Example API with card and payment data", function () {
    this.timeout(3000);
    let cardData = {
      name: "Test User",
      number: "4242424242424242",
      expireMonth: "2",
      expireYear: "2018",
      cvv2: "123",
      type: "visa"
    };
    let paymentData = {
      currency: "USD",
      total: "19.99"
    };

    let authorizeResult = {
      saved: true,
      currency: "USD"
    };

    let authorizeStub = sandbox.stub(ExampleApi.methods.authorize, "call", () => authorizeResult);
    let results = Meteor.call("exampleSubmit", "authorize", cardData, paymentData);
    expect(authorizeStub).to.have.been.calledWith({
      transactionType: "authorize",
      cardData: cardData,
      paymentData: paymentData
    });
    expect(results.saved).to.be.true;
  });

  it("should throw an error if card data is not correct", function () {
    let badCardData = {
      name: "Test User",
      cvv2: "123",
      type: "visa"
    };

    let paymentData = {
      currency: "USD",
      total: "19.99"
    };

    // Notice how you need to wrap this call in another function
    expect(function () {
      Meteor.call("exampleSubmit", "authorize", badCardData, paymentData);
    }
    ).to.throw;
  });
});

describe("Capture payment", function () {
  let sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("should call ExampleApi with transaction ID", function () {
    let captureResults = { success: true };
    let authorizationId = "abc1234";
    paymentMethod.transactionId = authorizationId;
    paymentMethod.amount = 19.99;

    let captureStub = sandbox.stub(ExampleApi.methods.capture, "call", () => captureResults);
    let results = Meteor.call("example/payment/capture", paymentMethod);
    expect(captureStub).to.have.been.calledWith({
      authorizationId: authorizationId,
      amount: 19.99
    });
    expect(results.saved).to.be.true;
  });

  it("should throw an error if transaction ID is not found", function () {
    sandbox.stub(ExampleApi.methods, "capture", function () {
      throw new Meteor.Error("Not Found");
    });
    expect(function () {
      Meteor.call("example/payment/capture", "abc123");
    }).to.throw;
  });
});

describe("Refund", function () {
  let sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("should call ExampleApi with transaction ID", function () {
    let refundResults = { success: true };
    let transactionId = "abc1234";
    let amount = 19.99;
    paymentMethod.transactionId = transactionId;
    let refundStub = sandbox.stub(ExampleApi.methods.refund, "call", () => refundResults);
    Meteor.call("example/refund/create", paymentMethod, amount);
    expect(refundStub).to.have.been.calledWith({
      transactionId: transactionId,
      amount: amount
    });
  });

  it("should throw an error if transaction ID is not found", function () {
    sandbox.stub(ExampleApi.methods.refund, "call", function () {
      throw new Meteor.Error("404", "Not Found");
    });
    let transactionId = "abc1234";
    paymentMethod.transactionId =  transactionId;
    expect(function () {
      Meteor.call("example/refund/create", paymentMethod, 19.99);
    }).to.throw(Meteor.Error, /Not Found/);
  });
});

describe("List Refunds", function () {
  let sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("should call ExampleApi with transaction ID", function () {
    let refundResults = { refunds: [] };
    const refundArgs = {
      transactionId: "abc1234"
    };
    let refundStub = sandbox.stub(ExampleApi.methods.refunds, "call", () => refundResults);
    Meteor.call("example/refund/list", paymentMethod);
    expect(refundStub).to.have.been.calledWith(refundArgs);
  });

  it("should throw an error if transaction ID is not found", function () {
    sandbox.stub(ExampleApi.methods, "refunds", function () {
      throw new Meteor.Error("404", "Not Found");
    });
    expect(() => Meteor.call("example/refund/list", paymentMethod)).to.throw(Meteor.Error, /Not Found/);
  });
});

