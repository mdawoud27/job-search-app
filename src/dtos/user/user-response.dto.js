export class UserResponseDto {
  static toResponse(user) {
    if (!user) {
      return null;
    }
    return {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      profilePic: user.profilePic,
      coverPic: user.coverPic,
      role: user.role,
      isConfirmed: user.isConfirmed,
      createdAt: user.createdAt,
    };
  }
}
