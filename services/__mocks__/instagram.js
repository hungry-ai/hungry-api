const instagram = jest.createMockFromModule("../instagram");

instagram.getStories = async (instagramId) => {
  return {
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
};

instagram.getInstagramId = async (instagramUsername) => {
  return { id: "17841458780532665" };
};

module.exports = {
  getStories: instagram.getStories,
  getInstagramId: instagram.getInstagramId,
};
