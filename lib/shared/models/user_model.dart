import '../../core/utils/json_parse_utils.dart';

class UserModel {
  final int id;
  final String? accountId;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  final String? image;
  final UserRole role;
  final bool verified;
  final String? emailVerifiedAt;
  final String? status;
  final double? balance;
  final String? referralCode;
  final double? referralEarnings;
  final String createdAt;

  UserModel({
    required this.id,
    this.accountId,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
    this.image,
    required this.role,
    required this.verified,
    this.emailVerifiedAt,
    this.status,
    this.balance,
    this.referralCode,
    this.referralEarnings,
    required this.createdAt,
  });

  String get fullName => '$firstName $lastName';
  bool get isAdmin => [
    'admin',
    'superadmin',
    'admin_vote',
    'admin_event',
    'admin_both',
  ].contains(role.name);

  bool get canManageEvents =>
      ['superadmin', 'admin_event', 'admin_both'].contains(role.name);

  bool get canManageVotes =>
      ['superadmin', 'admin_vote', 'admin_both'].contains(role.name);

  bool get isSuperAdmin => role.name == 'superadmin';

  bool get isEmailVerified =>
      verified || (emailVerifiedAt != null && emailVerifiedAt!.isNotEmpty);

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final roleJson = json['role'];
    final role = roleJson is Map
        ? UserRole.fromJson(Map<String, dynamic>.from(roleJson))
        : UserRole(
            id: parseApiInt(json['role_id']),
            name: 'user',
            displayName: 'User',
          );

    return UserModel(
      id: parseApiInt(json['id']),
      accountId: json['account_id']?.toString(),
      firstName: json['first_name']?.toString() ?? '',
      lastName: json['last_name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      image: json['image']?.toString(),
      role: role,
      verified: parseApiBool(json['verified']),
      emailVerifiedAt: json['email_verified_at']?.toString(),
      status: json['status']?.toString(),
      balance: parseApiDouble(json['balance']),
      referralCode: json['referral_code']?.toString(),
      referralEarnings: parseApiDouble(json['referral_earnings']),
      createdAt: json['created_at']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'account_id': accountId,
    'first_name': firstName,
    'last_name': lastName,
    'email': email,
    'phone': phone,
    'image': image,
    'role': role.toJson(),
    'verified': verified,
    'email_verified_at': emailVerifiedAt,
    'status': status,
    'balance': balance,
    'referral_code': referralCode,
    'referral_earnings': referralEarnings,
    'created_at': createdAt,
  };
}

class UserRole {
  final int id;
  final String name;
  final String displayName;

  UserRole({required this.id, required this.name, required this.displayName});

  factory UserRole.fromJson(Map<String, dynamic> json) => UserRole(
    id: parseApiInt(json['id']),
    name: json['name']?.toString() ?? 'user',
    displayName:
        json['display_name']?.toString() ??
        (json['name']?.toString().isNotEmpty == true
            ? json['name'].toString()[0].toUpperCase() +
                json['name'].toString().substring(1)
            : 'User'),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'display_name': displayName,
  };
}
