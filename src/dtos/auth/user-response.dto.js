export class UserResponseDto {
  // static fromRequest(user) {}

  static toResponse(user) {
    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      gender: user.gender,
      username: user.username,
      isConfirmed: user.isConfirmed,
      profilePic: user.profilePic,
      coverPic: user.coverPic,
      createdAt: user.createdAt,
    };
  }
}
