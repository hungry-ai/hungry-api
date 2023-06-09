jest.mock("../services/instagram");
const hungryai = require("../services/hungryai");

test("testing hungryai.getStories: ", () => {
  const testUsername = "Hungry AI";
  const parsed = hungryai.getStories(testUsername);
  const expectedJSON = {
    data: [
      {
        id: "17861937508009798",
      },
      {
        id: "17862253585030136",
      },
      {
        id: "17856428680064034",
      },
      {
        id: "17862537148046301",
      },
      {
        id: "17852121721080875",
      },
      {
        id: "17862694123018235",
      },
    ],
  };
  parsed.then((parsed) => {
    expect(parsed).toStrictEqual(expectedJSON);
  });
});
