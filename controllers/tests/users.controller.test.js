jest.mock("../../models/users.model");

const {
  deleteCurrentUser
} = require("../users.controller");
const {
  deleteUserById
} = require("../../models/users.model");

describe("deleteCurrentUser", () => {
  test("the current session is not destroyed if the database deletion fails", async () => {
    const req = {
      user: { id: 7 },
      session: {
        destroy: jest.fn()
      }
    };
    const res = {
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      end: jest.fn()
    };
    const next = jest.fn();

    deleteUserById.mockRejectedValue(
      new Error("Database error")
    );

    await expect(deleteCurrentUser(req, res, next))
      .rejects.toThrow("Database error");
    expect(req.session.destroy).not.toHaveBeenCalled();
    expect(res.clearCookie).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
  });

  test("forwards session destruction errors without sending a response", async () => {
    const error = new Error("Session destruction failed");
    const req = {
      user: { id: 7 },
      session: {
        destroy: jest.fn(callback => {
          callback(error);
        })
      }
    };
    const res = {
      clearCookie: jest.fn(),
      status: jest.fn(),
      end: jest.fn()
    };
    const next = jest.fn();

    deleteUserById.mockResolvedValue(7);

    await deleteCurrentUser(req, res, next);

    expect(deleteUserById).toHaveBeenCalledWith(
      req.user.id
    );
    expect(req.session.destroy).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.clearCookie).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
  });
});